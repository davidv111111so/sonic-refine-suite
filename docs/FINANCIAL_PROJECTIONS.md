# Level Audio Suite — Financial Projections & Unit Economics
**Last Updated:** 2026-02-28  
**Product:** levelaudio.live

---

## 1. Pricing Tiers

| Tier | Price | Billing |
|---|---|---|
| **Free** | $0 | — |
| **Premium** | $9.99/mo | Monthly subscription |
| **VIP Cloud** | $24.99/mo | Monthly subscription (Launch Promo) |
| **Desktop Pro** | $49.99 | One-time purchase (launch offer) |

---

## 2. Cloud Cost Per User Per Month

| Tier | Avg Tasks/Month | CPU-sec/Task | Cost/Task | Monthly Cost/User |
|---|---|---|---|---|
| **Free** | 5 enhancements (local) | 0 | $0.00 | **~$0.01** (auth only) |
| **Premium** | 150 mastering (max) + 150 stems (max) | ~240s + ~120s (CPU) | ~$0.008 + $0.004 | **~$1.80** (max) |
| **VIP Cloud** | 500 mastering (max) + 500 stems (max) | ~20s + ~10s (GPU) | ~$0.008 + $0.004 | **~$6.00** (max) |
| **Desktop Pro** | 0 (runs locally) | 0 | $0.00 | **$0.00** |

> **Note:** Cloud Run charges per vCPU-second (~$0.0000267/vCPU-s) and per GiB-second (~$0.0000029/GiB-s). GPU instances cost ~$0.0004/GPU-s in preview pricing.

---

## 3. Profit Per User Per Month

| Tier | Revenue | Server Cost | **Profit/User** | **Margin** |
|---|---|---|---|---|
| **Free** | $0.00 | $0.01 | **-$0.01** | — |
| **Premium** | $9.99 | $1.80 (max) | **$8.19** (min) | 81.9% (min) |
| **VIP Cloud** | $24.99 | $6.00 (max) | **$18.99** (min) | 76.0% (min) |
| **Desktop Pro** | $49.99 (once) | $0.00 | **$49.99** | 100% |

---

## 4. Web Subscription Revenue at Scale

### 30% Monthly Usage Assumption (Conservative)

| Users | Premium Revenue | VIP Revenue | Cloud Cost | **Monthly Profit** |
|---|---|---|---|---|
| 100 | $999 | — | ~$11 | **~$988** |
| 1,000 | $9,990 | — | ~$108 | **~$9,882** |
| 10,000 | $99,900 | — | ~$1,080 | **~$98,820** |

### 50% Monthly Usage (Moderate)

| Users | Premium Revenue | VIP Revenue | Cloud Cost | **Monthly Profit** |
|---|---|---|---|---|
| 100 | $999 | — | ~$18 | **~$981** |
| 1,000 | $9,990 | — | ~$180 | **~$9,810** |
| 10,000 | $99,900 | — | ~$1,800 | **~$98,100** |

### 80% Monthly Usage (Heavy)

| Users | Premium Revenue | VIP Revenue | Cloud Cost | **Monthly Profit** |
|---|---|---|---|---|
| 100 | $999 | — | ~$29 | **~$970** |
| 1,000 | $9,990 | — | ~$288 | **~$9,702** |
| 10,000 | $99,900 | — | ~$2,880 | **~$97,020** |

### 100% Monthly Usage (Max Limits)

| Users | Premium Revenue | VIP Revenue | Cloud Cost | **Monthly Profit** |
|---|---|---|---|---|
| 100 | $999 | — | ~$36 | **~$963** |
| 1,000 | $9,990 | — | ~$360 | **~$9,630** |
| 10,000 | $99,900 | — | ~$3,600 | **~$96,300** |

> **Key Insight:** Even at 100% max usage by all 10,000 users, cloud costs are only **~3.6%** of revenue. Audio SaaS has exceptional margins.

---

## 5. Mixed Tier Revenue (Realistic Scenario: 70% Premium, 20% VIP, 10% Free)

| Total Users | Paying Users | Premium (70%) | VIP (20%) | Free (10%) | **Monthly Revenue** | **Cloud Cost (50%)** | **Net Profit** |
|---|---|---|---|---|---|---|---|
| 100 | 90 | $629 | $540 | $0 | **$1,169** | ~$48 | **$1,121** |
| 1,000 | 900 | $6,293 | $5,398 | $0 | **$11,691** | ~$480 | **$11,211** |
| 10,000 | 9,000 | $62,930 | $53,982 | $0 | **$116,912** | ~$4,800 | **$112,112** |

---

## 6. Desktop Pro Revenue (One-Time Sales)

### $49.99 per license — Zero recurring server costs

| Units Sold | Revenue | Server Cost | **Total Profit** |
|---|---|---|---|
| 100 | $4,999 | $0 | **$4,999** |
| 1,000 | $49,990 | $0 | **$49,990** |
| 10,000 | $499,900 | $0 | **$499,900** |

> **Desktop Pro = pure profit.** No monthly cloud costs. Users process audio on their own hardware.

---

## 7. Combined Annual Revenue Projections

Assuming: 50% Premium usage, 50% Desktop customers buy in Year 1.

| Scenario | Web Subs (Annual) | Desktop Sales | **Total Year 1** |
|---|---|---|---|
| **Small** (100 web + 100 desktop) | $11,772 | $4,999 | **$16,771** |
| **Medium** (1,000 web + 500 desktop) | $117,720 | $24,995 | **$142,715** |
| **Large** (10,000 web + 2,000 desktop) | $1,177,200 | $99,980 | **$1,277,180** |

---

## 8. Fixed Infrastructure Costs (Monthly)

| Service | Cost |
|---|---|
| Netlify (Frontend hosting) | Free – $19/mo |
| Supabase (Auth + DB, Free tier) | $0 – $25/mo |
| Google Cloud Run (pay per use) | $0 min (scales to zero) |
| Backblaze B2 (10GB free) | $0 – $5/mo |
| Domain (levelaudio.live) | ~$1/mo amortized |
| **Total Fixed Costs** | **~$1 – $50/mo** |

> Cloud Run's **scale-to-zero** means you only pay when users actually process audio. Zero users = zero cost.

---

## 9. Break-Even Analysis

| Expense | Amount |
|---|---|
| Domain + Hosting | ~$25/mo |
| Your time (opportunity cost) | Variable |
| **Break-even at** | **3 Premium subscribers** |

With just **3 paying users at $9.99/mo**, the product covers all infrastructure costs.

---

## 10. Key Metrics Summary

| Metric | Value |
|---|---|
| Gross Margin (Premium) | **96.4%** |
| Gross Margin (VIP) | **93.7%** |
| Gross Margin (Desktop) | **100%** |
| Cloud cost per mastering task | ~$0.008 |
| Cloud cost per stem separation | ~$0.004 |
| Break-even subscribers | **3** |
| Max cloud cost at 10K Premium users (100% max usage) | ~$18,000/mo (Profit: ~$81,900) |

