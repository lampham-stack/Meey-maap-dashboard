/* ============================================
   MEEY ECOSYSTEM KPI DASHBOARD — SCRIPT
   ============================================ */

Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";

const GRID = 'rgba(255,255,255,0.06)';
const TT   = { backgroundColor:'rgba(13,17,23,0.95)', titleColor:'#e2e8f0', bodyColor:'#94a3b8', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, padding:12, cornerRadius:10, boxPadding:4 };

const C = {
    blue:   ['rgba(102,126,234,0.25)','rgba(102,126,234,1)'],
    purple: ['rgba(118,75,162,0.25)', 'rgba(118,75,162,1)'],
    pink:   ['rgba(240,147,251,0.25)','rgba(240,147,251,1)'],
    red:    ['rgba(245,87,108,0.25)', 'rgba(245,87,108,1)'],
    cyan:   ['rgba(79,172,254,0.25)', 'rgba(79,172,254,1)'],
    green:  ['rgba(67,233,123,0.25)', 'rgba(67,233,123,1)'],
    yellow: ['rgba(254,225,64,0.2)',  'rgba(254,225,64,1)'],
    orange: ['rgba(250,112,154,0.2)', 'rgba(250,112,154,1)'],
};

function xScale(opts={}) { return { grid:{display:false}, ticks:{color:'#94a3b8',...opts.ticks}, border:{display:false}, ...opts }; }
function yScale(opts={}) { return { grid:{color:GRID,drawBorder:false}, ticks:{color:'#94a3b8',...opts.ticks}, border:{display:false}, ...opts }; }

/* ── NAV ── */
let salesChartsInited = false;
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const pageEl = document.getElementById(item.dataset.page + '-page');
            pageEl.classList.add('active');
            // Lazy-init Sales charts the first time that tab is shown
            if (item.dataset.page === 'sales' && !salesChartsInited) {
                salesChartsInited = true;
                initPackageSoldMonthly();
                initPackageRevenueMonthly();
                initPackageMixDonut();
                initPackageGrowth();
            }
        });
    });
    initAll();
});

function initAll() {
    // Executive Summary
    initRevenueRoasMonthly();
    initUserContribution();
    initChannelRevenueRoas();
    initKpiFluctuation();
    initBudgetDonut();
    initCacRoasScatter();
    initMauPaidArea();
    initMeeyIdConversion();
    // Marketing Funnel page
    initCtrByChannel();
    initCostByChannel();
    initConvByChannel();
    initCostTrend();
    // Old conversion funnel charts (kept for compat)
    initMauTrend();
    initIdVsMql();
    initConvRate();
    // Sales Analytics charts are lazy-inited on first tab visit (canvas needs to be visible)

}

/* ════════════════════════════════════════
   EXECUTIVE SUMMARY — 4 charts
   ════════════════════════════════════════ */

/* Chart 1: Monthly Revenue bars + ROAS line (dual-axis) */
function initRevenueRoasMonthly() {
    const ctx = document.getElementById('revenueRoasMonthlyChart').getContext('2d');
    const months = ['T9/24','T10/24','T11/24','T12/24','T1/25','T2/25'];
    const revenue = [3200,3650,3900,4100,4480,4820];
    const cost    = [620,680,710,740,790,831];
    const roas    = revenue.map((r,i)=>(r/cost[i]).toFixed(2));

    const grdRev = ctx.createLinearGradient(0,0,0,260);
    grdRev.addColorStop(0,'rgba(102,126,234,0.8)');
    grdRev.addColorStop(1,'rgba(102,126,234,0.3)');

    const grdCost = ctx.createLinearGradient(0,0,0,260);
    grdCost.addColorStop(0,'rgba(240,147,251,0.7)');
    grdCost.addColorStop(1,'rgba(240,147,251,0.25)');

    new Chart(ctx, {
        data: {
            labels: months,
            datasets: [
                { type:'bar', label:'Doanh Thu (triệu ₫)', data:revenue, backgroundColor:grdRev, borderColor:'rgba(102,126,234,1)', borderWidth:0, borderRadius:8, yAxisID:'yRev', order:2 },
                { type:'bar', label:'Chi Phí MKT (triệu ₫)', data:cost, backgroundColor:grdCost, borderColor:'rgba(240,147,251,1)', borderWidth:0, borderRadius:8, yAxisID:'yRev', order:3 },
                { type:'line', label:'ROAS (x)', data:roas, borderColor:'#43e97b', backgroundColor:'transparent', borderWidth:2.5, pointBackgroundColor:'#43e97b', pointRadius:5, tension:0.4, yAxisID:'yRoas', order:1 }
            ]
        },
        options: {
            responsive:true, interaction:{mode:'index',intersect:false},
            plugins:{ legend:{position:'top',labels:{usePointStyle:true,padding:14}}, tooltip:{...TT,callbacks:{label:c=>c.datasetIndex<2?' ₫'+c.parsed.y.toLocaleString()+'M':' ROAS: '+c.parsed.y+'x'}} },
            scales: {
                yRev:  { ...yScale({ticks:{callback:v=>'₫'+v.toLocaleString()}}), position:'left', beginAtZero:false },
                yRoas: { ...yScale({grid:{display:false},ticks:{color:'#43e97b',callback:v=>v+'x'}}), position:'right', beginAtZero:false },
                x: xScale()
            }
        }
    });
}

/* Chart 2: Stacked bar — New vs Old Paid User revenue contribution */
function initUserContribution() {
    const ctx = document.getElementById('userContributionChart').getContext('2d');
    const months = ['T9/24','T10/24','T11/24','T12/24','T1/25','T2/25'];
    // New = first-time buyers, Old = repeat buyers
    const newRev = [1100,1280,1400,1520,1720,1988];
    const oldRev = [2100,2370,2500,2580,2760,2832];

    new Chart(ctx, {
        type:'bar',
        data:{
            labels:months,
            datasets:[
                { label:'Paid User Mới (mua lần đầu)', data:newRev, backgroundColor:'rgba(250,112,154,0.75)', borderColor:'rgba(250,112,154,1)', borderWidth:1, borderRadius:{topLeft:0,topRight:0,bottomLeft:6,bottomRight:6}, stack:'revenue' },
                { label:'Paid User Cũ (mua lại)', data:oldRev, backgroundColor:'rgba(102,126,234,0.65)', borderColor:'rgba(102,126,234,1)', borderWidth:1, borderRadius:{topLeft:6,topRight:6,bottomLeft:0,bottomRight:0}, stack:'revenue' }
            ]
        },
        options:{
            responsive:true, aspectRatio:2, interaction:{mode:'index',intersect:false},
            plugins:{ legend:{position:'top',labels:{usePointStyle:true,padding:12}}, tooltip:{...TT,callbacks:{label:c=>' '+c.dataset.label+': ₫'+c.parsed.y.toLocaleString()+'M',footer:(items)=>' Tổng: ₫'+(items.reduce((s,i)=>s+i.parsed.y,0)).toLocaleString()+'M'}} },
            scales:{ y:{...yScale({ticks:{callback:v=>'₫'+v.toLocaleString()}}),stacked:true,beginAtZero:true}, x:{...xScale(),stacked:true} }
        }
    });
}

/* Chart 3: Revenue grouped bar + ROAS line by channel */
function initChannelRevenueRoas() {
    const ctx = document.getElementById('channelRevenueRoasChart').getContext('2d');
    const channels = ['Facebook','Google','TikTok','Zalo','Organic'];
    const rev  = [1870,1450,790,430,280];
    const roas = [6.2,5.8,4.1,3.9,8.5];

    new Chart(ctx, {
        data:{
            labels:channels,
            datasets:[
                { type:'bar', label:'Revenue (triệu ₫)', data:rev, backgroundColor:[C.blue[0],C.purple[0],C.cyan[0],C.green[0],C.yellow[0]], borderColor:[C.blue[1],C.purple[1],C.cyan[1],C.green[1],C.yellow[1]], borderWidth:2, borderRadius:8, yAxisID:'yRev', order:2 },
                { type:'line', label:'ROAS (x)', data:roas, borderColor:'#f6ad55', backgroundColor:'transparent', borderWidth:2.5, pointBackgroundColor:channels.map((_,i)=>['#667eea','#764ba2','#00f2fe','#43e97b','#fee140'][i]), pointBorderColor:'#f6ad55', pointRadius:7, pointBorderWidth:2, tension:0.3, yAxisID:'yRoas', order:1 }
            ]
        },
        options:{
            responsive:true, interaction:{mode:'index',intersect:false},
            plugins:{ legend:{position:'top',labels:{usePointStyle:true,padding:12}}, tooltip:{...TT,callbacks:{label:c=>c.datasetIndex===0?' ₫'+c.parsed.y.toLocaleString()+'M':' ROAS: '+c.parsed.y+'x'}} },
            scales:{
                yRev:  { ...yScale({ticks:{callback:v=>'₫'+v.toLocaleString()}}), position:'left', beginAtZero:true },
                yRoas: { ...yScale({grid:{display:false},ticks:{color:'#f6ad55',callback:v=>v+'x'}}), position:'right', beginAtZero:true, max:12 },
                x: xScale()
            }
        }
    });
}

/* Chart 4: KPI fluctuation MoM % change — 5 KPIs */
function initKpiFluctuation() {
    const ctx = document.getElementById('kpiFluctuationChart').getContext('2d');
    const months = ['T10/24','T11/24','T12/24','T1/25','T2/25'];

    // % MoM change rounded to 1 decimal
    const data = {
        lead:     [8.2, 6.5, 7.8, 10.1, 11.4],
        mau:      [6.6, 5.1, 4.9,  5.1,  9.8],
        newUser:  [10.2,7.8, 9.4, 13.8, 15.3],
        roas:     [4.1, 2.2, 0.9,  2.4,  5.9],
        avgTime:  [-2.5,-1.8,-3.1,-4.2,-14.3]  // negative = shorter time = better
    };

    new Chart(ctx, {
        type:'line',
        data:{
            labels:months,
            datasets:[
                { label:'Lead Thu Được', data:data.lead, borderColor:C.cyan[1], backgroundColor:'transparent', borderWidth:2, pointRadius:5, tension:0.3 },
                { label:'MAU', data:data.mau, borderColor:C.green[1], backgroundColor:'transparent', borderWidth:2, pointRadius:5, tension:0.3 },
                { label:'Paid User Mới', data:data.newUser, borderColor:C.orange[1], backgroundColor:'transparent', borderWidth:2, pointRadius:5, tension:0.3 },
                { label:'ROAS', data:data.roas, borderColor:C.blue[1], backgroundColor:'transparent', borderWidth:2, pointRadius:5, tension:0.3 },
                { label:'Avg Time to Purchase (âm = tốt)', data:data.avgTime, borderColor:C.yellow[1], backgroundColor:'transparent', borderWidth:2, borderDash:[4,3], pointRadius:5, tension:0.3 }
            ]
        },
        options:{
            responsive:true, interaction:{mode:'index',intersect:false},
            plugins:{ legend:{position:'top',labels:{usePointStyle:true,padding:12,font:{size:11}}}, tooltip:{...TT,callbacks:{label:c=>' '+c.dataset.label+': '+c.parsed.y+'%'}} },
            scales:{
                y:{...yScale({ticks:{callback:v=>v+'%'}}), suggestedMin:-20, suggestedMax:20,
                   afterDraw(ch){
                       const {ctx:c,chartArea:{left,right},scales:{y}} = ch;
                       const py = y.getPixelForValue(0);
                       c.save(); c.strokeStyle='rgba(255,255,255,0.15)'; c.lineWidth=1.5; c.setLineDash([]);
                       c.beginPath();c.moveTo(left,py);c.lineTo(right,py);c.stroke();c.restore();
                   }
                  },
                x: xScale()
            }
        }
    });
}

/* Chart 5: Budget Donut */
function initBudgetDonut() {
    const ctx = document.getElementById('budgetDonutChart').getContext('2d');
    const channels  = ['Facebook Ads','Google Ads','TikTok Ads','Zalo Ads','Organic/Other'];
    const spend     = [320, 250, 165, 90, 6];
    const pct       = spend.map(v => ((v/831)*100).toFixed(1)+'%');
    const colors    = ['#667eea','#764ba2','#00f2fe','#43e97b','#fee140'];
    const colorsA   = ['rgba(102,126,234,0.75)','rgba(118,75,162,0.75)','rgba(0,242,254,0.75)','rgba(67,233,123,0.75)','rgba(254,225,64,0.75)'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: channels,
            datasets: [{ data: spend, backgroundColor: colorsA, borderColor: colors, borderWidth: 2, hoverOffset: 10 }]
        },
        options: {
            responsive: true,
            cutout: '62%',
            plugins: {
                legend: { position:'right', labels:{ usePointStyle:true, padding:14, color:'#94a3b8', font:{size:12} } },
                tooltip: { ...TT, callbacks: { label: (c) => ` ${c.label}: ₫${c.parsed}M (${pct[c.dataIndex]})` } }
            }
        },
        plugins: [{
            id:'donutCenter',
            afterDraw(ch) {
                const { ctx:c, chartArea:{ left,right,top,bottom } } = ch;
                const cx = (left+right)/2, cy = (top+bottom)/2;
                c.save();
                c.textAlign = 'center'; c.textBaseline = 'middle';
                c.fillStyle = '#e2e8f0'; c.font = 'bold 22px Inter';
                c.fillText('₫831M', cx, cy-10);
                c.fillStyle = '#64748b'; c.font = '11px Inter';
                c.fillText('Total Budget', cx, cy+12);
                c.restore();
            }
        }]
    });
}

/* Chart 6: CAC vs ROAS Scatter — Quadrant */
function initCacRoasScatter() {
    const ctx = document.getElementById('cacRoasScatterChart').getContext('2d');
    const channels = ['Facebook','Google','TikTok','Zalo','Organic'];
    const pts = [
        { x: 390, y: 6.2, r: 320 },  // Facebook: CAC=390K, ROAS=6.2, spend=320M
        { x: 391, y: 5.8, r: 250 },  // Google
        { x: 434, y: 4.1, r: 165 },  // TikTok
        { x: 409, y: 3.9, r: 90  },  // Zalo
        { x:  69, y: 8.5, r: 6   },  // Organic
    ];
    const clrs = ['#667eea','#764ba2','#00f2fe','#43e97b','#fee140'];

    new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: pts.map((p,i) => ({
                label: channels[i],
                data: [{ x: p.x, y: p.y, r: Math.max(8, Math.sqrt(p.r)*1.8) }],
                backgroundColor: clrs[i]+'99',
                borderColor: clrs[i],
                borderWidth: 2
            }))
        },
        options: {
            responsive: true,
            interaction: { mode:'point' },
            plugins: {
                legend: { position:'bottom', labels:{ usePointStyle:true, padding:12, color:'#94a3b8', font:{size:11} } },
                tooltip: { ...TT, callbacks: { label: c => ` ${c.dataset.label} | CAC: ₫${c.parsed.x}K | ROAS: ${c.parsed.y}x` } },
                annotation: {}
            },
            scales: {
                x: { ...xScale(), type:'linear', title:{ display:true, text:'CAC (nghìn ₫)', color:'#64748b', font:{size:11} },
                     grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#64748b', callback: v=>'₫'+v+'K' } },
                y: { ...yScale({ ticks:{callback:v=>v+'x'} }), title:{ display:true, text:'ROAS', color:'#64748b', font:{size:11} }, beginAtZero:false, min:2, max:10 }
            }
        },
        plugins: [{
            id: 'quadrantLines',
            afterDraw(ch) {
                const { ctx:c, chartArea:{left,right,top,bottom}, scales:{x,y} } = ch;
                const mx = x.getPixelForValue(300), my = y.getPixelForValue(5);
                c.save(); c.setLineDash([5,4]); c.lineWidth = 1;
                // vertical line
                c.strokeStyle = 'rgba(255,255,255,0.12)';
                c.beginPath(); c.moveTo(mx,top); c.lineTo(mx,bottom); c.stroke();
                // horizontal line
                c.beginPath(); c.moveTo(left,my); c.lineTo(right,my); c.stroke();
                // quadrant labels
                c.setLineDash([]); c.font = '10px Inter';
                c.fillStyle = 'rgba(72,187,120,0.55)'; c.textAlign='left';
                c.fillText('ROAS cao, CAC thấp ✓', left+8, top+16);
                c.fillStyle = 'rgba(252,129,129,0.45)'; c.textAlign='right';
                c.fillText('Cần tối ưu', right-8, bottom-8);
                c.restore();
            }
        }]
    });
}

/* Chart 7: MAU vs Paid User — Area overlap */
function initMauPaidArea() {
    const ctx = document.getElementById('mauPaidAreaChart').getContext('2d');
    const months = ['T9/24','T10/24','T11/24','T12/24','T1/25','T2/25'];
    const mau  = [98000,104500,109800,115200,121000,127400];
    const paid = [ 1380, 1507,  1636,  1764,  1903,  2147];

    // Dual axis for readability (MAU in thousands, Paid in units)
    const grdMAU = ctx.createLinearGradient(0,0,0,280);
    grdMAU.addColorStop(0,'rgba(67,233,123,0.35)');
    grdMAU.addColorStop(1,'rgba(67,233,123,0.01)');

    const grdPaid = ctx.createLinearGradient(0,0,0,280);
    grdPaid.addColorStop(0,'rgba(240,147,251,0.45)');
    grdPaid.addColorStop(1,'rgba(240,147,251,0.01)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label:'MAU (Monthly Active Users)', data:mau,  borderColor:'#43e97b', backgroundColor:grdMAU,  fill:true,  tension:0.4, borderWidth:2.5, pointBackgroundColor:'#43e97b', pointRadius:5, yAxisID:'yMAU' },
                { label:'Total Paid Users (Mới + Cũ)', data:paid, borderColor:'#f093fb', backgroundColor:grdPaid, fill:true,  tension:0.4, borderWidth:2.5, pointBackgroundColor:'#f093fb', pointRadius:5, yAxisID:'yPaid' }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { position:'top', labels:{ usePointStyle:true, padding:16 } },
                tooltip: { ...TT, callbacks: {
                    label: c => c.datasetIndex===0
                        ? ` MAU: ${c.parsed.y.toLocaleString()} users`
                        : ` Paid: ${c.parsed.y.toLocaleString()} users`,
                    footer: items => {
                        const mauV = items[0]?.parsed.y, paidV = items[1]?.parsed.y;
                        if(mauV && paidV) return ` Conv Rate: ${((paidV/mauV)*100).toFixed(2)}%`;
                    }
                }}
            },
            scales: {
                yMAU:  { ...yScale({ ticks:{callback:v=>(v/1000).toFixed(0)+'K'} }), position:'left',  beginAtZero:false, title:{display:true, text:'MAU', color:'#43e97b', font:{size:11}} },
                yPaid: { ...yScale({ grid:{display:false}, ticks:{color:'#f093fb', callback:v=>v.toLocaleString()} }), position:'right', beginAtZero:false, title:{display:true, text:'Paid Users', color:'#f093fb', font:{size:11}} },
                x: xScale()
            }
        }
    });
}

/* Chart 8: Meey ID vs MAU vs Paid User — Conversion Funnel */
function initMeeyIdConversion() {
    const ctx = document.getElementById('meeyIdConversionChart').getContext('2d');
    const months = ['T9/24','T10/24','T11/24','T12/24','T1/25','T2/25'];
    const meeyId = [11200, 12300, 13500, 14800, 16550, 18600];
    const mau    = [98000, 104500, 109800, 115200, 121000, 127400];
    const paid   = [1380, 1507, 1636, 1764, 1903, 2147];

    const grdId = ctx.createLinearGradient(0,0,0,280);
    grdId.addColorStop(0,'rgba(0,198,255,0.35)');
    grdId.addColorStop(1,'rgba(0,198,255,0.01)');

    const grdMau = ctx.createLinearGradient(0,0,0,280);
    grdMau.addColorStop(0,'rgba(67,233,123,0.3)');
    grdMau.addColorStop(1,'rgba(67,233,123,0.01)');

    const grdPaid = ctx.createLinearGradient(0,0,0,280);
    grdPaid.addColorStop(0,'rgba(250,112,154,0.35)');
    grdPaid.addColorStop(1,'rgba(250,112,154,0.01)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label:'MAU (Active Users)', data:mau, borderColor:'#43e97b', backgroundColor:grdMau, fill:true, tension:0.4, borderWidth:2.5, pointBackgroundColor:'#43e97b', pointRadius:5, yAxisID:'yMAU' },
                { label:'Meey ID (Đăng ký mới)', data:meeyId, borderColor:'#00c6ff', backgroundColor:grdId, fill:true, tension:0.4, borderWidth:2.5, pointBackgroundColor:'#00c6ff', pointRadius:5, yAxisID:'yMeeyId' },
                { label:'Paid User (Mua hàng)', data:paid, borderColor:'#fa709a', backgroundColor:grdPaid, fill:true, tension:0.4, borderWidth:2.5, pointBackgroundColor:'#fa709a', pointRadius:5, yAxisID:'yPaid' }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { position:'top', labels:{ usePointStyle:true, padding:16 } },
                tooltip: { ...TT, callbacks: {
                    label: c => {
                        const v = c.parsed.y.toLocaleString();
                        if(c.datasetIndex===0) return ` MAU: ${v}`;
                        if(c.datasetIndex===1) return ` Meey ID: ${v}`;
                        return ` Paid User: ${v}`;
                    },
                    footer: items => {
                        const mauV = items[0]?.parsed.y;
                        const idV  = items[1]?.parsed.y;
                        const paidV = items[2]?.parsed.y;
                        let lines = [];
                        if(idV && mauV) lines.push(` Active/ID: ${((mauV/idV)*100).toFixed(1)}% trở thành active`);
                        if(mauV && paidV) lines.push(` Paid/MAU: ${((paidV/mauV)*100).toFixed(2)}% chuyển đổi mua`);
                        if(idV && paidV) lines.push(` Paid/ID: ${((paidV/idV)*100).toFixed(1)}% tổng chuyển đổi`);
                        return lines;
                    }
                }}
            },
            scales: {
                yMAU: { ...yScale({ ticks:{callback:v=>(v/1000).toFixed(0)+'K'} }), position:'left', beginAtZero:false, title:{display:true, text:'MAU', color:'#43e97b', font:{size:11}} },
                yMeeyId: { ...yScale({ grid:{display:false}, ticks:{callback:v=>(v/1000).toFixed(1)+'K', color:'#00c6ff'} }), position:'right', beginAtZero:false, title:{display:true, text:'Meey ID', color:'#00c6ff', font:{size:11}} },
                yPaid: { display:false, beginAtZero:false },
                x: xScale()
            }
        }
    });
}


/* ════════════════════════════════════════
   MARKETING FUNNEL PAGE — 4 charts
   ════════════════════════════════════════ */

/* Chart F1: CTR & %Lead by Channel — grouped bar */
function initCtrByChannel() {
    const el = document.getElementById('ctrByChannelChart');
    if (!el) return;
    const ctx = el.getContext('2d');
    const channels = ['Facebook','Google','TikTok','Zalo','Organic'];
    // CTR = Click/Impression (%), %Lead = Lead/Click (%)
    const ctr     = [1.38, 1.51, 1.05, 0.82, 3.80];
    const pctLead = [15.8, 16.8, 14.6, 12.2, 10.9];
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: channels,
            datasets: [
                { label: 'CTR % (Click/Impression)', data: ctr,     backgroundColor: 'rgba(79,172,254,0.7)',  borderColor: '#4facfe', borderWidth:2, borderRadius:6, yAxisID:'yCtr' },
                { label: '%Lead (Lead/Click)',        data: pctLead, backgroundColor: 'rgba(67,233,123,0.65)', borderColor: '#43e97b', borderWidth:2, borderRadius:6, yAxisID:'yLead' }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { position:'top', labels:{ usePointStyle:true, padding:12 } },
                tooltip: { ...TT, callbacks: { label: c => ' ' + c.dataset.label + ': ' + c.parsed.y + '%' } }
            },
            scales: {
                yCtr:  { ...yScale({ ticks:{ callback: v => v + '%' } }), position:'left',  beginAtZero:true, title:{ display:true, text:'CTR (%)', color:'#4facfe', font:{size:11} } },
                yLead: { ...yScale({ grid:{ display:false }, ticks:{ color:'#43e97b', callback: v => v + '%' } }), position:'right', beginAtZero:true, title:{ display:true, text:'%Lead (%)', color:'#43e97b', font:{size:11} } },
                x: xScale()
            }
        }
    });
}

/* Chart F2: CPM / CPC / CPLead by Channel — grouped bar */
function initCostByChannel() {
    const el = document.getElementById('costByChannelChart');
    if (!el) return;
    const ctx = el.getContext('2d');
    const channels = ['Facebook','Google','TikTok','Zalo','Organic'];
    // Costs in thousand VND (K₫)
    const cpm    = [98,  105, 112,  90,   0];
    const cpc    = [7.1, 8.0, 10.5, 8.8,  0];
    const cplead = [42,  55,  71,   98,  18];
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: channels,
            datasets: [
                { label: 'CPM (nghìn ₫)',   data: cpm,    backgroundColor: 'rgba(102,126,234,0.7)',  borderColor: '#667eea', borderWidth:2, borderRadius:6 },
                { label: 'CPC (nghìn ₫)',   data: cpc,    backgroundColor: 'rgba(240,147,251,0.7)', borderColor: '#f093fb', borderWidth:2, borderRadius:6 },
                { label: 'CPLead (nghìn ₫)',data: cplead, backgroundColor: 'rgba(67,233,123,0.65)', borderColor: '#43e97b', borderWidth:2, borderRadius:6 }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { position:'top', labels:{ usePointStyle:true, padding:12 } },
                tooltip: { ...TT, callbacks: { label: c => ' ' + c.dataset.label + ': ₫' + c.parsed.y + 'K' } }
            },
            scales: {
                y: { ...yScale({ ticks:{ callback: v => '₫' + v + 'K' } }), beginAtZero:true },
                x: xScale()
            }
        }
    });
}

/* Chart F3: Conv rates breakdown by channel — grouped bar */
function initConvByChannel() {
    const el = document.getElementById('convByChannelChart');
    if (!el) return;
    const ctx = el.getContext('2d');
    const channels = ['Facebook','Google','TikTok','Zalo','Organic'];
    // conversion rates at each funnel stage per channel (%)
    const ctr     = [1.38, 1.51, 1.05, 0.82, 3.80];
    const pctLead = [15.8, 16.8, 14.6, 12.2, 10.9];
    const pctMeeyId  = [38.2, 41.5, 32.0, 28.6, 45.0];
    const pctPaid = [41.9, 45.2, 38.0, 35.1, 48.3];
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: channels,
            datasets: [
                { label: 'CTR %',   data: ctr,     backgroundColor: 'rgba(102,126,234,0.75)', borderColor:'#667eea', borderWidth:2, borderRadius:6 },
                { label: '%Lead',   data: pctLead, backgroundColor: 'rgba(67,233,123,0.75)',  borderColor:'#43e97b', borderWidth:2, borderRadius:6 },
                { label: '%Meey ID', data: pctMeeyId, backgroundColor: 'rgba(0,198,255,0.70)', borderColor:'#00c6ff', borderWidth:2, borderRadius:6 },
                { label: '%Paid',   data: pctPaid, backgroundColor: 'rgba(254,225,64,0.75)',  borderColor:'#fee140', borderWidth:2, borderRadius:6 }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { position:'top', labels:{ usePointStyle:true, padding:12, font:{size:11} } },
                tooltip: { ...TT, callbacks: { label: c => ' ' + c.dataset.label + ': ' + c.parsed.y + '%' } }
            },
            scales: {
                y: { ...yScale({ ticks:{ callback: v => v + '%' } }), beginAtZero:true },
                x: xScale()
            }
        }
    });
}

/* Chart F4: Cost trend 6 months — CPLead, CP Meey ID, CPUser */
function initCostTrend() {
    const el = document.getElementById('costTrendChart');
    if (!el) return;
    const ctx = el.getContext('2d');
    const months   = ['T9/24','T10/24','T11/24','T12/24','T1/25','T2/25'];
    const cplead   = [83, 78, 74, 70, 65, 58.5];
    const cpMeeyId = [210, 198, 185, 176, 175, 162];
    const cpuser   = [480, 462, 438, 420, 421, 387];
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label:'CPLead (K₫)',  data: cplead, borderColor:'#43e97b', backgroundColor:'transparent', borderWidth:2.5, pointBackgroundColor:'#43e97b', pointRadius:4, tension:0.4 },
                { label:'CP Meey ID (K₫)', data: cpMeeyId, borderColor:'#00c6ff', backgroundColor:'transparent', borderWidth:2.5, pointBackgroundColor:'#00c6ff', pointRadius:4, tension:0.4 },
                { label:'CPUser/CAC (K₫)', data: cpuser, borderColor:'#fee140', backgroundColor:'transparent', borderWidth:2.5, pointBackgroundColor:'#fee140', pointRadius:4, tension:0.4 }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { position:'top', labels:{ usePointStyle:true, padding:12 } },
                tooltip: { ...TT, callbacks: { label: c => ' ' + c.dataset.label + ': ₫' + c.parsed.y + 'K' } }
            },
            scales: {
                y: { ...yScale({ ticks:{ callback: v => '₫' + v + 'K' } }), beginAtZero:false },
                x: xScale()
            }
        }
    });
}

/* ════════════════════════════════════════
   CONVERSION FUNNEL
   ════════════════════════════════════════ */
function initMauTrend() {
    const ctx = document.getElementById('mauTrendChart').getContext('2d');
    const grd = ctx.createLinearGradient(0,0,0,250);
    grd.addColorStop(0,'rgba(67,233,123,0.3)'); grd.addColorStop(1,'rgba(67,233,123,0.02)');
    new Chart(ctx, {
        type:'line',
        data:{
            labels:['T9/24','T10/24','T11/24','T12/24','T1/25','T2/25'],
            datasets:[{ label:'MAU', data:[98000,104500,109800,115200,121000,127400], borderColor:C.green[1], backgroundColor:grd, fill:true, tension:0.4, borderWidth:2.5, pointBackgroundColor:C.green[1], pointRadius:4 }]
        },
        options:{
            responsive:true,
            plugins:{ legend:{display:false}, tooltip:{...TT,callbacks:{label:c=>' MAU: '+c.parsed.y.toLocaleString()}} },
            scales:{ y:{...yScale({ticks:{callback:v=>(v/1000)+'K'}}),beginAtZero:false}, x:xScale() }
        }
    });
}

function initIdVsMql() {
    const ctx = document.getElementById('idVsMqlChart').getContext('2d');
    new Chart(ctx, {
        type:'bar',
        data:{
            labels:['Facebook','Google','TikTok','Zalo','Organic'],
            datasets:[
                { label:'New Meey IDs', data:[5200,3800,2600,1800,1100], backgroundColor:C.cyan[0], borderColor:C.cyan[1], borderWidth:2, borderRadius:8 },
                { label:'MQLs', data:[3100,2250,1500,1080,890], backgroundColor:C.green[0], borderColor:C.green[1], borderWidth:2, borderRadius:8 }
            ]
        },
        options:{
            responsive:true,
            plugins:{ legend:{position:'top',labels:{usePointStyle:true,padding:12}}, tooltip:TT },
            scales:{ y:{...yScale(),beginAtZero:true}, x:xScale() }
        }
    });
}

function initConvRate() {
    const ctx = document.getElementById('convRateChart').getContext('2d');
    const grd = ctx.createLinearGradient(0,0,0,250);
    grd.addColorStop(0,'rgba(240,147,251,0.3)'); grd.addColorStop(1,'rgba(240,147,251,0.02)');
    new Chart(ctx, {
        type:'line',
        data:{
            labels:['T9/24','T10/24','T11/24','T12/24','T1/25','T2/25'],
            datasets:[
                { label:'Conversion Rate (%)', data:[19.5,20.8,21.3,22.0,23.1,24.3], borderColor:C.pink[1], backgroundColor:grd, fill:true, tension:0.4, borderWidth:2.5, pointBackgroundColor:C.pink[1], pointRadius:4 },
                { label:'Target 25%', data:Array(6).fill(25), borderColor:'rgba(246,173,85,0.7)', backgroundColor:'transparent', borderDash:[5,4], borderWidth:1.5, pointRadius:0 }
            ]
        },
        options:{
            responsive:true,
            plugins:{ legend:{position:'top',labels:{usePointStyle:true,padding:12}}, tooltip:{...TT,callbacks:{label:c=>' '+c.parsed.y+'%'}} },
            scales:{ y:{...yScale({ticks:{callback:v=>v+'%'}}),suggestedMin:15,suggestedMax:30}, x:xScale() }
        }
    });
}


/* ════════════════════════════════════════
   SALES ANALYTICS — 4 charts
   ════════════════════════════════════════ */

const PKG_MONTHS = ['T9/24','T10/24','T11/24','T12/24','T1/25','T2/25'];
const PKG_BASIC  = [840, 878, 910, 948, 985, 1050];
const PKG_MID    = [542, 568, 595, 624, 672, 742];
const PKG_PREM   = [198, 212, 228, 248, 280, 355];

/* S1 — Stacked bar: số gói bán theo tháng */
function initPackageSoldMonthly() {
    const el = document.getElementById('packageSoldMonthlyChart');
    if (!el) return;
    new Chart(el.getContext('2d'), {
        type: 'bar',
        data: {
            labels: PKG_MONTHS,
            datasets: [
                { label: 'Gói Cơ Bản',    data: PKG_BASIC, backgroundColor: 'rgba(79,172,254,0.80)',  borderColor: '#4facfe', borderWidth: 1.5, stack: 'pkg', borderRadius: 3 },
                { label: 'Gói Trung Cấp', data: PKG_MID,   backgroundColor: 'rgba(161,140,209,0.80)', borderColor: '#a18cd1', borderWidth: 1.5, stack: 'pkg', borderRadius: 3 },
                { label: 'Gói Cao Cấp',   data: PKG_PREM,  backgroundColor: 'rgba(253,160,133,0.90)', borderColor: '#fda085', borderWidth: 1.5, stack: 'pkg', borderRadius: 3 }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, padding: 12 } },
                tooltip: { ...TT, callbacks: {
                    label: c => ' ' + c.dataset.label + ': ' + c.parsed.y.toLocaleString() + ' gói',
                    footer: items => 'Tổng: ' + items.reduce((s, i) => s + i.parsed.y, 0).toLocaleString() + ' gói'
                }}
            },
            scales: {
                y: { ...yScale({ ticks: { callback: v => v.toLocaleString() } }), stacked: true, beginAtZero: true },
                x: { ...xScale(), stacked: true }
            }
        }
    });
}

/* S2 — Multi-line area: revenue từng gói qua 6 tháng */
function initPackageRevenueMonthly() {
    const el = document.getElementById('packageRevenueMonthlyChart');
    if (!el) return;
    const ctx = el.getContext('2d');
    const revBasic = PKG_BASIC.map(v => Math.round(v * 0.6));   // ×600K → M₫
    const revMid   = PKG_MID.map(v   => Math.round(v * 2.5));   // ×2,500K → M₫
    const revPrem  = PKG_PREM.map(v  => Math.round(v * 6.5));   // ×6,500K → M₫

    const gB = ctx.createLinearGradient(0, 0, 0, 260);
    gB.addColorStop(0, 'rgba(79,172,254,0.28)');  gB.addColorStop(1, 'rgba(79,172,254,0.02)');
    const gM = ctx.createLinearGradient(0, 0, 0, 260);
    gM.addColorStop(0, 'rgba(161,140,209,0.28)'); gM.addColorStop(1, 'rgba(161,140,209,0.02)');
    const gP = ctx.createLinearGradient(0, 0, 0, 260);
    gP.addColorStop(0, 'rgba(253,160,133,0.38)'); gP.addColorStop(1, 'rgba(253,160,133,0.02)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: PKG_MONTHS,
            datasets: [
                { label: 'Cơ Bản (M₫)',    data: revBasic, borderColor: '#4facfe', backgroundColor: gB, fill: true, tension: 0.4, borderWidth: 2.5, pointBackgroundColor: '#4facfe', pointRadius: 4 },
                { label: 'Trung Cấp (M₫)', data: revMid,   borderColor: '#a18cd1', backgroundColor: gM, fill: true, tension: 0.4, borderWidth: 2.5, pointBackgroundColor: '#a18cd1', pointRadius: 4 },
                { label: 'Cao Cấp (M₫)',   data: revPrem,  borderColor: '#fda085', backgroundColor: gP, fill: true, tension: 0.4, borderWidth: 2.5, pointBackgroundColor: '#fda085', pointRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, padding: 12 } },
                tooltip: { ...TT, callbacks: { label: c => ' ' + c.dataset.label + ': ₫' + c.parsed.y.toLocaleString() + 'M' } }
            },
            scales: {
                y: { ...yScale({ ticks: { callback: v => '₫' + v.toLocaleString() + 'M' } }), beginAtZero: true },
                x: xScale()
            }
        }
    });
}

/* S3 — Dual-ring doughnut: tỷ trọng số lượng vs revenue */
// Inline plugin để vẽ text ở trung tâm donut (register trước khi new Chart)
const salesDonutCenterPlugin = {
    id: 'salesDonutCenter',
    afterDraw(chart) {
        if (chart.canvas.id !== 'packageMixDonutChart') return;
        const { ctx, chartArea: { left, right, top, bottom } } = chart;
        const cx = (left + right) / 2, cy = (top + bottom) / 2;
        ctx.save();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 17px Inter, system-ui, sans-serif';
        ctx.fillText('2,147', cx, cy - 9);
        ctx.fillStyle = '#64748b'; ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.fillText('tổng gói', cx, cy + 10);
        ctx.restore();
    }
};
Chart.register(salesDonutCenterPlugin);

function initPackageMixDonut() {
    const el = document.getElementById('packageMixDonutChart');
    if (!el) return;
    const labels  = ['Gói Cơ Bản', 'Gói Trung Cấp', 'Gói Cao Cấp'];
    const qtyData = [1050, 742, 355];
    const revData = [630,  1855, 2308];
    const solidC  = ['rgba(79,172,254,0.85)', 'rgba(161,140,209,0.85)', 'rgba(253,160,133,0.90)'];
    const lightC  = ['rgba(79,172,254,0.35)', 'rgba(161,140,209,0.35)', 'rgba(253,160,133,0.40)'];
    const borderC = ['#4facfe', '#a18cd1', '#fda085'];

    new Chart(el.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                { label: 'Số gói (vòng trong)', data: qtyData, backgroundColor: solidC, borderColor: borderC, borderWidth: 2, hoverOffset: 10, weight: 1 },
                { label: 'Revenue (vòng ngoài)', data: revData, backgroundColor: lightC, borderColor: borderC.map(c => c + '99'), borderWidth: 1.5, hoverOffset: 10, weight: 1.6 }
            ]
        },
        options: {
            responsive: true,
            cutout: '38%',
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, padding: 14, color: '#94a3b8', font: { size: 11 } } },
                tooltip: { ...TT, callbacks: {
                    label: c => c.datasetIndex === 0
                        ? ' ' + c.label + ': ' + c.parsed.toLocaleString() + ' gói'
                        : ' ' + c.label + ': ₫' + c.parsed.toLocaleString() + 'M'
                }}
            }
        }
    });
}

/* S4 — Line: tốc độ tăng trưởng MoM % từng gói */
function initPackageGrowth() {
    const el = document.getElementById('packageGrowthChart');
    if (!el) return;
    // Tính MoM % từ mảng tuyệt đối
    function momPct(arr) {
        return arr.slice(1).map((v, i) => +((v - arr[i]) / arr[i] * 100).toFixed(1));
    }
    const months    = ['T10/24', 'T11/24', 'T12/24', 'T1/25', 'T2/25'];
    const growBasic = momPct(PKG_BASIC);   // [4.5, 3.6, 4.2, 3.9, 6.6]
    const growMid   = momPct(PKG_MID);     // [4.8, 4.8, 4.9, 7.7, 10.4]
    const growPrem  = momPct(PKG_PREM);    // [7.1, 7.5, 8.8, 12.9, 26.8]

    new Chart(el.getContext('2d'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: 'Gói Cơ Bản %',    data: growBasic, borderColor: '#4facfe', backgroundColor: 'rgba(79,172,254,0.08)',  fill: true, tension: 0.35, borderWidth: 2.5, pointBackgroundColor: '#4facfe', pointRadius: 5 },
                { label: 'Gói Trung Cấp %', data: growMid,   borderColor: '#a18cd1', backgroundColor: 'rgba(161,140,209,0.08)', fill: true, tension: 0.35, borderWidth: 2.5, pointBackgroundColor: '#a18cd1', pointRadius: 5 },
                { label: 'Gói Cao Cấp % 🚀', data: growPrem, borderColor: '#fda085', backgroundColor: 'rgba(253,160,133,0.15)', fill: true, tension: 0.35, borderWidth: 3.5, pointBackgroundColor: '#fda085', pointRadius: 7, pointStyle: 'star' }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, padding: 12 } },
                tooltip: { ...TT, callbacks: { label: c => ' ' + c.dataset.label + ': +' + c.parsed.y + '%' } }
            },
            scales: {
                y: { ...yScale({ ticks: { callback: v => v + '%' } }), beginAtZero: true },
                x: xScale()
            }
        }
    });
}

