class Utils {
  static getSellBuyPrices(buyPrice) {
      //Get the different sell and buy price multipliers from `carUtils`.
      const { sell_prices, buy_prices } = carUtils;
      const { s1, s2, s3 } = sell_prices;
      const { b1, b2, b3 } = buy_prices
  
      // Calculate the buy and sell prices based on the given buy price
      // and the multipliers.
      let costBuy, costSell;
  
      if (buyPrice < 300000) {
        [costBuy, costSell] = [buyPrice * b1, buyPrice * s1];
      } else if (buyPrice >= 300000 && buyPrice < 475000) {
        [costBuy, costSell] = [buyPrice * b2, buyPrice * s2];
      } else if (buyPrice >= 475000) {
        [costBuy, costSell] = [buyPrice * b3, buyPrice * s3];
      }
  
      // Otherwise, return the rounded buy and sell prices.
      return {
        buyPrice: Math.floor(costBuy), // Round the buy and sell price to the nearest integer
        sellPrice: Math.floor(costSell),
      };
  }
}

// Store the sell and buy price multipliers in an object.
const carUtils = {
  sell_prices: {
    s1: 0.7, // Lower bound sell multiplier
    s2: 0.7, // Middle bound sell multiplier
    s3: 0.75, // Upper bound sell multiplier
  },
  buy_prices: {
    b1: 0.85, // Lower bound buy multiplier
    b2: 0.85, // Middle bound buy multiplier
    b3: 0.85, // Upper bound buy multiplier
  },
  // Export the `getSellBuyPrices` method from `Utils`.
  getSellBuyPrices: Utils.getSellBuyPrices,
};

module.exports = Utils;