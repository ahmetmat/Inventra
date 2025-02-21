import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, CrosshairMode } from 'lightweight-charts';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';

const PATENT_TOKEN_ABI = [
  "function getTokenMetrics() view returns (uint256,uint256,uint256,uint256,uint256,bool)",
  "function getTradeHistory(uint256 count) external view returns (tuple(uint256 timestamp, uint256 price, uint256 volume)[])"
];

const TradingViewChart = ({ tokenAddress, patentTitle, isDarkMode = false }) => {
  const chartContainerRef = useRef(null);
  const chart = useRef(null);
  const candlestickSeries = useRef(null);
  const resizeObserver = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const chartConfig = {
    layout: {
      fontSize:12,
      fontFamily: 'Roboto, sans-serif',
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: isDarkMode ? '#334158' : '#e1e4e8', style: 1 },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        width: 4,
        color: '#6B7280',
        style: 6,
      },
      horzLine: {
        visible: true,
        labelVisible: true,
      },
    },
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
      autoScale: true,
      alignLabels: true,
      ticksVisible: true,
      entireTextOnly: true,
      borderColor: '#1E274D20',
      format: {
        type: 'price',
        precision: 8,
        minMove: 0.00000001,
      },
    },
    timeScale: {
      borderVisible: false,
      timeVisible: true,
      secondsVisible: true,
      tickMarkFormatter: (time) => {
        const date = new Date(time * 1000);
        return date.toLocaleTimeString();
      },
      fixLeftEdge: true,
      fixRightEdge: true,
      // Bar genişliğini artırarak çubukların dolu görünmesini sağlayın:
      barSpacing: 12,
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
    },
    handleScale: {
      axisPressedMouseMove: true,
      pinch: true,
    },
  };

  const destroyChart = () => {
    if (candlestickSeries.current) {
      candlestickSeries.current = null;
    }
    if (chart.current) {
      chart.current.remove();
      chart.current = null;
    }
  };

  useEffect(() => {
    const setupChart = async () => {
      if (!chartContainerRef.current) return;

      destroyChart();

      const width = chartContainerRef.current.clientWidth;
      const height = chartContainerRef.current.clientHeight || 600;

      chart.current = createChart(chartContainerRef.current, {
        ...chartConfig,
        width,
        height,
      });

      // Candlestick serisini v5'e göre oluşturuyoruz:
      candlestickSeries.current = chart.current.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        // Eğer kenarlardan rahatsız oluyorsanız, border görünürlüğünü kapatabilirsiniz:
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        priceFormat: {
          type: 'price',
          precision: 8,
          minMove: 0.000001,
        },
        priceScaleId: 'right',
      });

      const toolTipEl = document.createElement('div');
      toolTipEl.className = `
        hidden absolute z-50 py-2 px-3
        bg-white dark:bg-gray-800 
        shadow-lg rounded-md
        text-xs font-mono
        border border-gray-200 dark:border-gray-700
      `;
      chartContainerRef.current.appendChild(toolTipEl);

      chart.current.subscribeCrosshairMove((param) => {
        if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
          toolTipEl.style.display = 'none';
          return;
        }

        const data = param.seriesData.get(candlestickSeries.current);
        if (!data) {
          toolTipEl.style.display = 'none';
          return;
        }

        const date = new Date(Number(param.time) * 1000);
        const formattedTime = date.toLocaleTimeString();
        const priceChange = data.close - data.open;
        const priceChangePercent = (priceChange / data.open) * 100;

        toolTipEl.style.display = 'block';
        toolTipEl.style.left = `${param.point.x}px`;
        toolTipEl.style.top = `${param.point.y}px`;
        toolTipEl.innerHTML = `
          <div class="space-y-1">
            <div class="font-bold">${formattedTime}</div>
            <div>Price: ${Number(data.close).toFixed(8)} ETH</div>
            <div class="${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}">
              Change: ${priceChange >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%
            </div>
          </div>
        `;
      });

      const updateData = async () => {
        if (!candlestickSeries.current) return;

        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const contract = new ethers.Contract(tokenAddress, PATENT_TOKEN_ABI, provider);
          const trades = await contract.getTradeHistory(100);
          
          const processedData = trades.reduce((acc, trade) => {
            const timestamp = Number(trade.timestamp);
            const price = Number(ethers.utils.formatEther(trade.price));
            const minute = Math.floor(timestamp / 60) * 60;
            
            let candle = acc.find(c => c.time === minute);
            if (!candle) {
              candle = {
                time: minute,
                open: price,
                high: price,
                low: price,
                close: price
              };
              acc.push(candle);
            } else {
              candle.high = Math.max(candle.high, price);
              candle.low = Math.min(candle.low, price);
              candle.close = price;
            }
            return acc;
          }, []);

          candlestickSeries.current.setData(processedData);
          chart.current?.timeScale().fitContent();
        } catch (error) {
          console.error('Data fetch error:', error);
        }
      };

      await updateData();
      const intervalId = setInterval(updateData, 15000);
      setIsLoading(false);

      resizeObserver.current = new ResizeObserver(entries => {
        if (chart.current && entries[0]) {
          const newRect = entries[0].contentRect;
          chart.current.applyOptions({ width: newRect.width });
        }
      });

      resizeObserver.current.observe(chartContainerRef.current);

      return () => {
        clearInterval(intervalId);
        if (resizeObserver.current) {
          resizeObserver.current.disconnect();
        }
        if (toolTipEl.parentNode) {
          toolTipEl.parentNode.removeChild(toolTipEl);
        }
      };
    };

    setupChart();

    return () => {
      destroyChart();
    };
  }, [tokenAddress, isDarkMode, patentTitle]);

  return (
    <div className="relative w-full h-[600px]" ref={chartContainerRef}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;