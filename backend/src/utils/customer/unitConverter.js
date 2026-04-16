const logger = require("../../config/logger");

exports.convertToBaseUnit = (soldQuantity, sellingUnit, sellPerUnitQty, baseUnit) => {
  const quantityToDeduct = soldQuantity * sellPerUnitQty;

  logger.info(`Converting: ${soldQuantity} of ${sellPerUnitQty} ${sellingUnit} to base unit ${baseUnit}`);

  if (baseUnit.toLowerCase() === 'kg' && sellingUnit.toLowerCase() === 'gm') {
    return quantityToDeduct / 1000;
  }
  if (baseUnit.toLowerCase() === 'gm' && sellingUnit.toLowerCase() === 'kg') {
    return quantityToDeduct * 1000;
  }

  if (baseUnit.toLowerCase() === 'ltr' && sellingUnit.toLowerCase() === 'ml') {
    return quantityToDeduct / 1000;
  }
  if (baseUnit.toLowerCase() === 'ml' && sellingUnit.toLowerCase() === 'ltr') {
    return quantityToDeduct * 1000;
  }
  
  if (baseUnit.toLowerCase() === 'dozen' && sellingUnit.toLowerCase() === 'piece') {
      return quantityToDeduct / 12;
  }
  if (baseUnit.toLowerCase() === 'piece' && sellingUnit.toLowerCase() === 'dozen') {
    return quantityToDeduct * 12;
  }

  if (baseUnit.toLowerCase() === sellingUnit.toLowerCase()) {
    return quantityToDeduct;
  }

  logger.warn(`No conversion rule found for ${sellingUnit} to ${baseUnit}. Assuming 1:1 conversion.`);
  return quantityToDeduct;
};