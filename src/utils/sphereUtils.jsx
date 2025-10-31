export const convertToSphericalCoords = (data) => {
  // const prices = data.map((d) => d.price);
  // const minPrice = Math.min(...prices);
  // const maxPrice = Math.max(...prices);
  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return data.map((d, i) => {
    const thetaRange = 60;
    const phiRange = 50;

    const thetaStart = (90 - thetaRange) * (Math.PI / 180);
    const thetaEnd = (90 + thetaRange) * (Math.PI / 180);
    const phiStart = (90 - phiRange) * (Math.PI / 180);
    const phiEnd = (90 + phiRange) * (Math.PI / 180);

    // 시간 → θ
    const theta =
      thetaStart + (i / (data.length - 1)) * (thetaEnd - thetaStart);

    // 가격 → φ (위일수록 고가)
    // const normalized = (d.price - minPrice) / (maxPrice - minPrice);
    const normalized = (d.close - minPrice) / (maxPrice - minPrice);
    const phi = phiStart + (1 - normalized) * (phiEnd - phiStart);

    const temp = Math.sin(phi);
    const x = Math.cos(theta) * temp;
    const y = Math.cos(phi);
    const z = Math.sin(theta) * temp;

    // 🔊 freq: 가격이 높을수록 높은 음 (200~1000Hz)
    // const freq = 200 + normalized * 800;
    // 기존: 200~1000Hz 선형 맵핑
    // 개선: log scale (100~2000Hz)
    const minFreq = 100;
    const maxFreq = 2000;
    const freq = minFreq * Math.pow(maxFreq / minFreq, normalized);

    return {
      // date: d.date,
      // price: d.price,
      date: d.timestamp,
      price: d.close,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      z: Number(z.toFixed(4)),
      theta: Number(theta.toFixed(4)),
      phi: Number(phi.toFixed(4)),
      freq: Math.round(freq),
    };
  });
};
