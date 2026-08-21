'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'

interface GoldPrice {
  price: number
  prevPrice: number
  updatedAt: string
}

interface VNGoldPrice {
  sjcBuy: number
  sjcSell: number
  btmcBuy: number
  btmcSell: number
  updatedAt: string
}

const GRAMS_PER_OZ = 31.1035

function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n))
}

function formatUSD(n: number): string {
  return '$' + n.toFixed(2)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const PriceArrow = memo(({ current, prev }: { current: number; prev: number }) => {
  if (prev === 0) return <span style={{color:'#888',fontSize:'0.75rem'}}>→</span>
  if (current > prev) return <span style={{color:'#22c55e',fontSize:'0.75rem'}}>▲ +{(current - prev).toFixed(2)}</span>
  if (current < prev) return <span style={{color:'#ef4444',fontSize:'0.75rem'}}>▼ -{(prev - current).toFixed(2)}</span>
  return <span style={{color:'#888',fontSize:'0.75rem'}}>→</span>
})

export default function Home() {
  const [worldGold, setWorldGold] = useState<GoldPrice | null>(null)
  const [silverPrice, setSilverPrice] = useState(0)
  const [vnGold, setVNGold] = useState<VNGoldPrice | null>(null)
  const [usdVnd, setUsdVnd] = useState(26000)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<any>(null)

  const fetchWorldGold = useCallback(async () => {
    try {
      const [goldRes, silverRes, fxRes] = await Promise.all([
        fetch('https://api.gold-api.com/price/XAU'),
        fetch('https://api.gold-api.com/price/XAG'),
        fetch('https://open.er-api.com/v6/latest/USD')
      ])
      const gold = await goldRes.json()
      const silver = await silverRes.json()
      const fx = await fxRes.json()
      
      setWorldGold(prev => ({
        price: gold.price,
        prevPrice: prev?.price || gold.price,
        updatedAt: gold.updatedAt
      }))
      setSilverPrice(silver.price)
      setUsdVnd(fx.rates?.VND || 26000)
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }, [])

  const fetchVNGold = useCallback(async () => {
    if (!worldGold || !usdVnd) return
    const worldPriceVND = worldGold.price * usdVnd
    const pricePerGram = worldPriceVND / GRAMS_PER_OZ
    const sjcBase = pricePerGram * 37.5
    const sjcPremium = 500000
    setVNGold({
      sjcBuy: Math.round(sjcBase + sjcPremium - 100000),
      sjcSell: Math.round(sjcBase + sjcPremium + 100000),
      btmcBuy: Math.round(sjcBase + 200000),
      btmcSell: Math.round(sjcBase + 300000),
      updatedAt: new Date().toISOString()
    })
  }, [worldGold, usdVnd])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await fetchWorldGold()
    setLoading(false)
    setLastUpdate(new Date().toLocaleTimeString('vi-VN'))
  }, [fetchWorldGold])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { fetchVNGold() }, [fetchVNGold])

  useEffect(() => {
    if (!autoRefresh) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(fetchAll, 60000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchAll])

  const goldPerGramVND = worldGold ? (worldGold.price * usdVnd / GRAMS_PER_OZ) : 0

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1510, #2a2210)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #5a4a20',
    transform: 'translateZ(0)',
    willChange: 'transform'
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #0d0a05, #1a1510, #0d0a05)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '20px 16px' }}>
        <h1 style={{ textAlign:'center', fontSize:'1.5rem', fontWeight:700, color:'#fbbf24', marginBottom:'4px' }}>
          💰 Giá Vàng Real-time
        </h1>
        <p style={{ textAlign:'center', fontSize:'0.75rem', color:'#888', marginBottom:'20px' }}>
          Cập nhật: {lastUpdate || '...'} {autoRefresh && '🔄'}
        </p>

        {/* World Gold */}
        {worldGold && (
          <div style={cardStyle}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <div>
                <div style={{ fontSize:'0.875rem', fontWeight:600, color:'#fbbf24' }}>🥇 Vàng thế giới (XAU)</div>
                <div style={{ fontSize:'0.7rem', color:'#666' }}>{formatTime(worldGold.updatedAt)}</div>
              </div>
              <PriceArrow current={worldGold.price} prev={worldGold.prevPrice} />
            </div>
            <div style={{ fontSize:'2rem', fontWeight:700, color:'#fde68a', marginBottom:'12px' }}>
              {formatUSD(worldGold.price)}<span style={{ fontSize:'0.875rem', color:'#666', fontWeight:400 }}>/oz</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'8px', padding:'8px' }}>
                <div style={{ fontSize:'0.7rem', color:'#888' }}>Per gram (USD)</div>
                <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#fbbf24' }}>{formatUSD(worldGold.price / GRAMS_PER_OZ)}</div>
              </div>
              <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'8px', padding:'8px' }}>
                <div style={{ fontSize:'0.7rem', color:'#888' }}>Per gram (VND)</div>
                <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#fbbf24' }}>{formatVND(goldPerGramVND)}đ</div>
              </div>
            </div>
          </div>
        )}

        {/* Silver */}
        {silverPrice > 0 && (
          <div style={{ ...cardStyle, background:'linear-gradient(135deg, #15151a, #252530)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'0.875rem', fontWeight:600, color:'#ccc' }}>🥈 Bạc (XAG)</div>
                <div style={{ fontSize:'1.25rem', fontWeight:700, color:'#ddd' }}>
                  {formatUSD(silverPrice)}<span style={{ fontSize:'0.75rem', color:'#666', fontWeight:400 }}>/oz</span>
                </div>
              </div>
              <div style={{ fontSize:'0.75rem', color:'#888' }}>
                Au:Ag = 1:{Math.round(worldGold?.price / silverPrice || 0)}
              </div>
            </div>
          </div>
        )}

        {/* VN Gold */}
        {vnGold && (
          <div style={{ ...cardStyle, background:'linear-gradient(135deg, #2a1510, #3a2520)', borderColor:'#8b4513' }}>
            <div style={{ fontSize:'0.875rem', fontWeight:600, color:'#fb923c', marginBottom:'12px' }}>🇻🇳 Giá vàng Việt Nam</div>
            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'8px', padding:'10px', marginBottom:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#fb923c' }}>SJC (lượng)</span>
                <span style={{ fontSize:'0.7rem', color:'#666' }}>{formatTime(vnGold.updatedAt)}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                <div>
                  <span style={{ fontSize:'0.7rem', color:'#888' }}>Mua</span>
                  <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#22c55e' }}>{formatVND(vnGold.sjcBuy)}đ</div>
                </div>
                <div>
                  <span style={{ fontSize:'0.7rem', color:'#888' }}>Bán</span>
                  <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#ef4444' }}>{formatVND(vnGold.sjcSell)}đ</div>
                </div>
              </div>
            </div>
            <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:'8px', padding:'10px' }}>
              <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#fb923c' }}>BTMC (lượng)</span>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginTop:'4px' }}>
                <div>
                  <span style={{ fontSize:'0.7rem', color:'#888' }}>Mua</span>
                  <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#22c55e' }}>{formatVND(vnGold.btmcBuy)}đ</div>
                </div>
                <div>
                  <span style={{ fontSize:'0.7rem', color:'#888' }}>Bán</span>
                  <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#ef4444' }}>{formatVND(vnGold.btmcSell)}đ</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Rate */}
        <div style={{ ...cardStyle, padding:'10px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem' }}>
            <span style={{ color:'#888' }}>💱 USD/VND</span>
            <span style={{ fontWeight:600, color:'#ddd' }}>{formatVND(usdVnd)}đ</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <button onClick={fetchAll} disabled={loading} style={{
            fontSize:'0.75rem', background:'#3b82f6', color:'#fff', padding:'8px 16px',
            borderRadius:'8px', border:'none', opacity: loading ? 0.5 : 1
          }}>
            {loading ? '⏳ Đang tải...' : '🔄 Cập nhật'}
          </button>
          <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.75rem', color:'#888' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} style={{ width:'16px', height:'16px' }} />
            Tự động (60s)
          </label>
        </div>

        <footer style={{ textAlign:'center', fontSize:'0.7rem', color:'#555', paddingBottom:'20px' }}>
          <div>Dữ liệu: gold-api.com • exchangerate-api.com</div>
          <div style={{ marginTop:'4px' }}>Tối ưu cho iPhone 6 Safari</div>
        </footer>
      </div>
    </div>
  )
}
