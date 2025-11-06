export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        padding: 10,
        borderRadius: 10,
        border: '1px solid #ddd',
        fontSize: 13,
        color: '#333',
        lineHeight: 1.4,
        minWidth: 140,
      }}
    >
      <div>
        <b>{d.date}</b>
      </div>
      <div>종가 : ₩{d.close.toLocaleString()}</div>
      <div>시가 : ₩{d.open.toLocaleString()}</div>
      <div>고가 : ₩{d.high.toLocaleString()}</div>
      <div>저가 : ₩{d.low.toLocaleString()}</div>
      <div>거래량 : {d.volume.toLocaleString()}</div>
      <div>등락률 : {d.rate}%</div>
    </div>
  );
}
