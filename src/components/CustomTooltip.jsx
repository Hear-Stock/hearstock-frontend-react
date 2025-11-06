export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        padding: 15,
        borderRadius: 10,
        border: '1px solid #ddd',
        fontSize: 13,
        color: '#333',
        lineHeight: 1.4,
        minWidth: 110,
      }}
    >
      <div>
        <b>{d.timestamp}</b>
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>종가</span> :{' '}
        {d.price.toLocaleString()}원
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>시가</span> :{' '}
        {d.open.toLocaleString()}원
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>고가</span> :{' '}
        {d.high.toLocaleString()}원
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>저가</span> : {d.low.toLocaleString()}
        원
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>거래량</span> :{'     '}
        {d.volume.toLocaleString()}
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>등락률</span> : {d.fluctuation_rate}%
      </div>
    </div>
  );
}
