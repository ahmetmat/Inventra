# Inventra

<p align="center">
  <img src="https://github.com/ahmetmat/Inventra/blob/main/Resources/banner.png" alt="Sublime's custom image"/>
</p>
<p align="center">
   <img src="https://img.shields.io/badge/made_with-Solidity-blue?style=plastic" /></a>
         <a href="#backers" alt="Backers on Open Collective">
         <a href="#backers" alt="Backers on Open Collective">
        <img src="https://img.shields.io/github/commit-activity/t/ahmetmat/Inventra?style=plastic" /></a>
        <a href="#backers" alt="Backers on Open Collective">
       <img src="https://img.shields.io/github/repo-size/ahmetmat/Inventra?style=plastic" /></a>
                <a href="#backers" alt="Backers on Open Collective">
        <img src="https://img.shields.io/github/stars/ahmetmat/Inventra?style=plastic" /></a>
                <a href="#backers" alt="Backers on Open Collective">
        <img src="https://img.shields.io/github/watchers/ahmetmat/Inventra?style=plastic" /></a>
                <a href="#backers" alt="Backers on Open Collective">
        <img src="https://img.shields.io/github/forks/ahmetmat/Inventra?style=plastic" /></a>
</p>


This repository contains a **web-based platform** that enables patent holders to tokenize their patents, breaking them down into smaller, tradeable units using **Unit Test Tokens (UTTs)**. The system facilitates decentralized ownership, licensing, and sales of patent rights in a transparent and efficient manner.

## 🌟 Features
- **Patent Tokenization** – Convert patents into fractionalized tokens for sale.
- **Units Network Token (UNITO) Mechanism** – Patents are divided into UTTs, allowing for easy purchase, trading, and licensing.
- **Smart Contracts & Blockchain Integration** – Ensures secure and verifiable ownership transfers.
- **Web-Based Dashboard** – Intuitive UI for managing tokenized patents and transactions.
- **Payment & Licensing Options** – Supports various methods for acquiring patents or licensing rights.

## 🔧 Tech Stack
- **Frontend:** React.js 
- **Backend:** Node.js 
- **Blockchain:** Ethereum 
- **Smart Contracts:** Solidity

## 🚀 Installation & Setup
### Prerequisites
- Node.js & npm installed
- MetaMask or other Web3 wallet

### Steps
1. **Clone the repository**
   ```sh
   git clone https://github.com/your-username/patent-tokenization.git
   cd patent-tokenization
   ```
2. **Install dependencies**
   ```sh
   npm install  # For frontend
   pip install -r requirements.txt  # If using Python backend
   ```
3. **Start the development server**
   ```sh
   npm start  # Runs frontend
   flask run  # Runs backend if using Flask
   ```
4. **Deploy smart contracts**
   ```sh
   npx hardhat run scripts/deploy.js --network rinkeby
   ```

## 📜 Smart Contract Overview
The platform uses **Solidity-based smart contracts** to tokenize patents and manage transactions. The contract includes:
- `MintPatentToken` – Converts a patent into tokenized units.
- `BuyTokenUnit` – Allows users to purchase specific UNITO.
- `TransferOwnership` – Enables resale and transfer of patent tokens.

## 📌 Usage
1. **Register/Login** to access the dashboard.
2. **Upload a patent** and tokenize it into UNITO.
3. **Buy/Sell UTTs** via the marketplace.
4. **License a patent** by acquiring sufficient UNITO.
5. **Track ownership and royalties** via the blockchain ledger.

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a PR with your improvements.

## 📜 License
This project is licensed under the MIT License.


## Developers

| Name | Github | Telegram | 
| ------ | ------ |------ | 
| Ahmet Tahir Mat | [@ahmetmat](https://github.com/ahmetmat) | [thinkere](https://t.me/thinkere)
| Yusuf Colak | [@yusufcolak1](https://github.com/yusufcolak1) | [colaksa](https://t.me/colaksa) 
| Eymen Efe Altun | [@eymenefealtun](https://github.com/eymenefealtun) | [temparos](https://t.me/temparos) 

