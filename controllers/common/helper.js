const getEditionDetails = async (allMints) => {
  const mints = allMints.filter((m) => m?.marketplace);
  const activeMints = mints.filter((m) => m?.marketplace?.active === true);

  const floorPrice =
    (activeMints.length > 0 &&
      activeMints.sort(
        (a, b) => a.marketplace.cryptoPrice - b.marketplace.cryptoPrice,
      )[0].marketplace.cryptoPrice) ||
    0;

  const listedBetween =
    (activeMints.length > 1 &&
      activeMints.sort(
        (a, b) => b.marketplace.cryptoPrice - a.marketplace.cryptoPrice,
      )[0].marketplace.cryptoPrice) ||
    0;

  const filteredMints = mints.filter(
    (mint) =>
      mint?.marketplace?.lastSaleDate && mint.marketplace.active === true,
  );
  const lastSaleValue =
    (filteredMints.length > 0 &&
      filteredMints.sort(
        (a, b) =>
          new Date(b.marketplace.lastSaleDate) -
          new Date(a.marketplace.lastSaleDate),
      )[0].marketplace.cryptoPrice) ||
    0;
  const editionDetails = {
    lastSaleValue,
    floorPrice,
    listedBetween,
    totalMints: allMints.length || 0,
  };

  return editionDetails;
};

const sortNFTsByRarity = (sortOrder, paintingsState) => {
  let sortedList = [];
  const rarity = [
    'Unique', // 1
    'Legendary', // 2-10
    'Extraordinary', // 11-50
    'Masterpiece', // 51-100
    'Classic', // 101-250
    'Rare', // 251-500
    'Limited', // 501-999
    'Common', // 1000+
    'Special',
  ];
  if (sortOrder === -1) {
    rarity.forEach((item) => {
      const exit = paintingsState.filter((o) => o.rarity === item);
      sortedList = [...sortedList, ...exit];
    });
  } else {
    rarity.reverse().forEach((item) => {
      const exit = paintingsState.filter((o) => o.rarity === item);
      sortedList = [...sortedList, ...exit];
    });
  }
  return sortedList;
};

module.exports = { getEditionDetails, sortNFTsByRarity };
