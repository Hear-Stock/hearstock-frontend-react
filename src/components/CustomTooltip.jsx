export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const d = payload[0]?.payload || {};

  // 안전하게 숫자 포맷팅
  const safeNumber = (v) =>
    typeof v === 'number' && !isNaN(v) ? v.toLocaleString() : '-';

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
        <b>{d.date || '날짜 없음'}</b>
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>종가</span> : {safeNumber(d.price)}원
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>시가</span> : {safeNumber(d.open)}원
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>고가</span> : {safeNumber(d.high)}원
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>저가</span> : {safeNumber(d.low)}원
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>거래량</span> : {safeNumber(d.volume)}
      </div>
      <div>
        <span style={{ fontWeight: 700 }}>등락률</span> :{' '}
        {d.fluctuation_rate ?? '-'}%
      </div>
    </div>
  );
}
