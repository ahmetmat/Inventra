// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

interface IPatentRegistry {
    function getPatent(uint256 Pid) external view returns (
        string memory title,
        string memory ipfsHash,
        uint256 price,
        bool isForSale,
        address inventor,
        uint256 createdAt,
        string memory patentId,
        bool isVerified
    );
}

contract PatentToken is ERC20, Ownable, ReentrancyGuard {
    using Math for uint256;

    // Constants
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant MIN_PRICE = 1e10;
    uint256 public constant MIN_LIQUIDITY = 0.1 ether;
    
    // Patent specific details
    struct Patent {
        string title;
        string ipfsHash;
        uint256 price;
        bool isForSale;
        address inventor;
        uint256 createdAt;
        string patentId;
        bool isVerified;
    }
    
    // State variables
    uint256 public basePrice;
    uint256 public currentPrice;
    address public immutable patentRegistryAddress;
    uint256 public immutable patentId;
    Patent public patentDetails;
    uint256 public liquidityPool;
    uint256 public volume24h;
    uint256 public lastPriceUpdate;
    uint256 public holdersCount;
    bool public isTrading;

    // Sanal (virtual) likidite: Fiyat hesaplamasında kullanılacak yüksek bir rezerv değeri
    uint256 public virtualReserve;
    
    // Trading history
    struct TradeMetrics {
        uint256 timestamp;
        uint256 price;
        uint256 volume;
    }
    
    TradeMetrics[] public tradeHistory;
    mapping(address => uint256) public userTrades;

    // Events
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 price);
    event TokensSold(address indexed seller, uint256 amount, uint256 price);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event PatentDetailsUpdated(string ipfsHash, uint256 price);

    constructor(
        string memory name,
        string memory symbol,
        address _patentRegistryAddress,
        uint256 _patentId,
        address initialOwner
    ) payable ERC20(name, symbol) Ownable(initialOwner) {
        require(msg.value >= MIN_LIQUIDITY, "Insufficient initial liquidity");
        
        basePrice = MIN_PRICE;
        currentPrice = basePrice;
        patentRegistryAddress = _patentRegistryAddress;
        patentId = _patentId;
        isTrading = true;
        lastPriceUpdate = block.timestamp;

        // Initialize liquidity and mint tokens (ilk dağıtımda gerçek token rezervi kullanılacak ancak
        // daha sonra mint on-demand yaklaşımı uygulanacak)
        liquidityPool = msg.value;
        _mint(address(this), MAX_SUPPLY / 2);
        _mint(initialOwner, MAX_SUPPLY / 2);

        // Sanal likiditeyi, örneğin 1e24 olarak ayarlıyoruz (ihtiyaç duyduğunuz kadar yüksek belirleyin)
        virtualReserve = 1e24;

        // Fetch initial patent details
        IPatentRegistry registry = IPatentRegistry(_patentRegistryAddress);
        (
            string memory title,
            string memory ipfsHash,
            uint256 price,
            bool isForSale,
            address inventor,
            uint256 createdAt,
            string memory patentIdStr,
            bool isVerified
        ) = registry.getPatent(_patentId);

        patentDetails = Patent({
            title: title,
            ipfsHash: ipfsHash,
            price: price,
            isForSale: isForSale,
            inventor: inventor,
            createdAt: createdAt,
            patentId: patentIdStr,
            isVerified: isVerified
        });

        emit LiquidityAdded(msg.sender, msg.value);
    }

    // Fiyat hesaplamasını virtualReserve kullanacak şekilde güncelliyoruz
    function calculatePrice(uint256 amount) public view returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        uint256 scalingFactor = 1e18;
        // Burada gerçek token rezervi yerine virtualReserve kullanılıyor
        uint256 priceIncrease = (amount * scalingFactor) / (virtualReserve + 1);
        uint256 finalPrice = MIN_PRICE + priceIncrease;
        return finalPrice;
    }

    // Kullanıcı alım işlemini mint on-demand yöntemiyle gerçekleştiriyoruz
   function buyTokens(uint256 amount) external payable nonReentrant {
    require(isTrading, "Trading is paused");
    require(amount > 0, "Amount must be greater than 0");
    require(patentDetails.isForSale, "Patent not for sale");

    uint256 price = calculatePrice(amount);
    uint256 totalCost = (amount * price) / 10**18;
    require(msg.value >= totalCost, "Insufficient payment");

    // Contract'ta satış için bulunan tokenleri transfer ediyoruz
    require(balanceOf(address(this)) >= amount, "Not enough tokens in sale pool");
    _transfer(address(this), msg.sender, amount);

    tradeHistory.push(TradeMetrics({
        timestamp: block.timestamp,
        price: price,
        volume: amount
    }));
    
    uint256 oldPrice = currentPrice;
    currentPrice = price;
    lastPriceUpdate = block.timestamp;
    volume24h += amount;
    
    // Eğer kullanıcı daha önce hiç token almamışsa, holder sayısını artırın
    if (balanceOf(msg.sender) == amount) {
        holdersCount++;
    }
    
    // Sanal likidite güncellemesi: İşlemden elde edilen UNIT0 toplamı
    liquidityPool += totalCost;
    
    // Fazla ödeme varsa geri gönder
    if (msg.value > totalCost) {
        payable(msg.sender).transfer(msg.value - totalCost);
    }
    
    emit TokensPurchased(msg.sender, amount, price);
    emit PriceUpdated(oldPrice, price, block.timestamp);
}

    // Satış işlemi: Kullanıcı tokenlerini sözleşmeye aktarır ve karşılığında ETH alır
    function sellTokens(uint256 amount) external nonReentrant {
        require(isTrading, "Trading is paused");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(liquidityPool > 0, "No liquidity");
        
        uint256 price = calculatePrice(amount);
        uint256 saleProceeds = (amount * price) / 10**18;
        require(liquidityPool >= saleProceeds, "Insufficient liquidity for sale");
        
        // Tokenleri kullanıcıdan sözleşmeye transfer ediyoruz ve ardından tokenleri yakıyoruz
        _transfer(msg.sender, address(this), amount);
        _burn(address(this), amount);
        
        currentPrice = price;
        lastPriceUpdate = block.timestamp;
        volume24h += amount;
        
        if (balanceOf(msg.sender) == 0) {
            holdersCount--;
        }
        
        tradeHistory.push(TradeMetrics({
            timestamp: block.timestamp,
            price: price,
            volume: amount
        }));
        
        liquidityPool -= saleProceeds;
        payable(msg.sender).transfer(saleProceeds);
        
        emit TokensSold(msg.sender, amount, price);
        emit PriceUpdated(currentPrice, price, block.timestamp);
    }

    // Admin fonksiyonları
    function updatePatentDetails(string memory newIpfsHash, uint256 newPrice) external onlyOwner {
        patentDetails.ipfsHash = newIpfsHash;
        patentDetails.price = newPrice;
        emit PatentDetailsUpdated(newIpfsHash, newPrice);
    }

    function setPatentForSale(bool forSale) external onlyOwner {
        patentDetails.isForSale = forSale;
    }

    function withdrawExcessLiquidity(uint256 amount) external onlyOwner {
        require(liquidityPool > MIN_LIQUIDITY + amount, "Insufficient excess liquidity");
        liquidityPool -= amount;
        payable(owner()).transfer(amount);
    }

    // View fonksiyonları
    function getPatentDetails() external view returns (Patent memory) {
        return patentDetails;
    }

    function getTradeHistory(uint256 count) external view returns (TradeMetrics[] memory) {
        uint256 historyLength = tradeHistory.length;
        uint256 resultCount = Math.min(count, historyLength);
        TradeMetrics[] memory result = new TradeMetrics[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = tradeHistory[historyLength - resultCount + i];
        }
        
        return result;
    }

    function getTokenMetrics() external view returns (
        uint256 _currentPrice,
        uint256 _basePrice,
        uint256 _liquidityPool,
        uint256 _volume24h,
        uint256 _holdersCount,
        bool _isTrading
    ) {
        return (
            currentPrice,
            basePrice,
            liquidityPool,
            volume24h,
            holdersCount,
            isTrading
        );
    }

    receive() external payable {}
    fallback() external payable {}
}