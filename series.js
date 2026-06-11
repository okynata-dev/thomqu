// Контент-паки серий. Дефолт (huang/NVDA) живёт в engine.js; здесь — Сейлор/MSTR и Виталик/ETH.
// Band'ы = 52w на 2026-06-10, ПРОВИЗОРНЫЕ до заморозки на дату старта коллекции.
// Факты: MSTR 52w 104.17–457.20 (цена ~120.44); Strategy держит 845,256 BTC по средней $75,681.
// ETH 52w 1,388.12–4,955.90 (цена ~1,670). Обе серии сейчас в выгорании — у NVDA зеркальная фаза.
window.SERIES_CFG={
saylor:{
 name:'Michael Saylor',ticker:'MSTR',low:104.17,high:457.20,ath:'457.20',copy:'21,000,000 ONLY',
 bubbleRow:['LEVERAGED BITCOIN','20__','2026'],
 heads:{
  hot:['STRATEGY BUYS THE DIP, AGAIN','THERE IS NO SECOND BEST','THE INFINITE MONEY GLITCH',
   'ANOTHER BILLION, ANOTHER BLOCK','WALL ST. FUNDS THE ORANGE STANDARD','MSTR PREMIUM WIDENS',
   'SELL BONDS, BUY BITCOIN','LEVERAGE AS A RELIGION','845,256 AND COUNTING','YOU DO NOT SELL YOUR BITCOIN',
   'THE TREASURY THAT ATE A COMPANY','CONVERTS OVERSUBSCRIBED, AGAIN'],
  mid:['IS MSTR A FUND OR A FAITH?','WHAT IF THE PREMIUM CLOSES?','A SOFTWARE COMPANY, TECHNICALLY',
   'HOW MUCH LEVERAGE IS TOO MUCH?','CONVERTIBLE NOTES ALL THE WAY DOWN','NAV IS A SOCIAL CONSTRUCT',
   '21 MILLION DIVIDED BY EVERYONE','THE $64 BILLION AVERAGE','ONE MAN, ONE BALANCE SHEET',
   'WHO BUYS THE LAST CONVERT?'],
  cold:['MARGIN CALL AT THE CHURCH OF BITCOIN','THE PREMIUM IS GONE','FORCED SELLER',
   'CONVERTS COME DUE','THE GREAT UNWIND, LEVERED','SOFTWARE COMPANY SEEKS SOFTWARE REVENUE',
   'HODL MEETS HAIRCUT','DILUTION AT THE BOTTOM','WHO LIQUIDATES THE LIQUIDATOR?',
   'NAV BELOW ONE','THE ORANGE STANDARD, REPRICED']},
 ticks:{
  hot:['MSTR 457.20 ▲ +9.8% · MNAV 2.4×','BTC HELD 845,256 · AVG $75,681','BTC 118,400 ▲ · MSTR BETA 3.1',
   'CONVERTS $7.3B · COUPON 0.625%','ATM ISSUANCE $2.1B THIS WEEK · ACCRETIVE','OPT FLOW ▲ CALLS 78% · IV 96'],
  mid:['NASDAQ: MSTR · 52W 104.17–457.20','BTC HELD 845,256 · COST BASIS $63.9B','MNAV 1.1× · PREMIUM THINNING',
   'SOFTWARE REV $115M · TREASURY $64B','SHORT INT 11% · DAYS TO COVER 2.4','VOL 28,441,090 · BETA 3.1'],
  cold:['MSTR 120.44 ▼ −57% YOY','MNAV 0.9× · DISCOUNT TO COIN','BTC 74,300 ▼ · AVG COST UNDERWATER',
   'CONVERT WALL 2028 · REFI RISK ▲','FORCED LIQUIDATION WATCH · LULD 09:47','OPT FLOW ▼ PUTS 81% · IV 140']},
 stamps:{
  hot:['₿','845,256','2.4×','+9.8%','457.20','21M','∞'],
  mid:['1.0×','104.17','52W','75,681','?'],
  cold:['0.9×','▼','120.44','−57%','MARGIN','SOLD?']},
 quotes:{
  hot:['“there is no second best”','“bitcoin is hope”','“we will never sell”','“volatility is vitality”',
   '“the dollar is melting ice”'],
  mid:['“a company is just a wrapper”','“the premium is the product”','“laser eyes fade, debt does not”'],
  cold:['“we remain committed to the strategy”','“temporary impairment”','“the thesis is unchanged”',
   '“no margin calls expected” — filing, p.84']},
 pageidx:{
  hot:'MARKETS B1 · CRYPTO C1 · OPINION A19 · YACHTS D4',
  mid:'MARKETS B1 · CRYPTO C1 · OPINION A19 · OBITUARIES D7',
  cold:'MARKETS B1 · LIQUIDATIONS C1 · RESTRUCTURING D2 · OBITUARIES D7'},
 corpus:{
  hot:'Every share sold buys more bitcoin and every bitcoin bought lifts the share. The flywheel hums like a prayer '
   +'wheel and Wall Street queues to lend at zero for a glimpse of orange. The treasury grew past the company years '
   +'ago; now the company is a rumor attached to a balance sheet. Dilution is accretion, the deck says, and the deck '
   +'has been right the whole way up. There is no second best.',
  mid:'Somewhere inside the structure there is still a software business, small and warm, like a pilot light. Around '
   +'it: convertible notes, preferred stacks, at-the-market offerings, a premium that exists because people agree it '
   +'does. The man speaks in centuries and the market listens in quarters. Whether this is treasury management or '
   +'performance art depends on the closing price.',
  cold:'The premium went first, quietly, like air from a door left open. Then the converts grew teeth and the lawyers '
   +'started reading the indentures aloud. An average cost is a confession when the spot trades below it. The chair '
   +'still tweets sunrise photos; the desk sells what it swore it never would. Leverage is a religion until the '
   +'first margin call, after which it is a court filing.'},
 sect:[['COIN',310],['HOOD',98],['RIOT',11],['MARA',17],['CLSK',9],['SMLR',38],['BITO',22]],
 earn:[['BTC HELD',845256,0,''],['AVG COST',75681,0,''],['COST BASIS',63.9,0.2,'B'],
       ['MNAV',0.9,0.6,'×'],['CONVERTS',7.3,1,'B'],['SOFTWARE REV',0.11,0.02,'B']],
 glitch:{words:['₿','MSTR','BTC','21M','845,256','NAV','×3','HODL','SELL?','120.44','457.20','MARGIN'],
  heads:['THERE IS NO SECOND BEST','THE PREMIUM IS GONE','MARGIN CALL AT THE CHURCH OF BITCOIN',
   'STRATEGY BUYS THE DIP, AGAIN','NAV IS A SOCIAL CONSTRUCT','FORCED SELLER','YOU DO NOT SELL YOUR BITCOIN',
   'CONVERTS COME DUE'],
  ticks:['MSTR 120.44 ▼ −57% YOY','BTC HELD 845,256 · AVG $75,681','MNAV 0.9× · DISCOUNT TO COIN',
   '52W 104.17–457.20','CONVERTS $7.3B · COUPON 0.625%','OPT FLOW ▼ PUTS 81% · IV 140']}},
powell:{
 name:'Jerome Powell',ticker:'FED',low:6.55,high:8.97,ath:'8.97T',copy:'LEGAL TENDER',
 bubbleRow:['THE EVERYTHING BUBBLE','20__','2022'],
 heads:{
  hot:['THE PRINTER HUMS','WHATEVER IT TAKES, AGAIN','QE TO INFINITY','MONEY IS FREE. EVERYTHING IS A BUY',
   'THE FED PUT LIVES','LIQUIDITY FOR ALL','ZERO FOR LONGER','THE BALANCE SHEET DOUBLES',
   'ASSET PRICES ARE THE ECONOMY','BUY EVERYTHING, THE FED HAS YOUR BACK'],
  mid:['TRANSITORY','DATA DEPENDENT','SOFT LANDING, MAYBE','THE DOT PLOT SHRUGS','HIGHER FOR LONGER',
   'TWO MORE MEETINGS','WHAT IS NEUTRAL, ANYWAY?','THE LAST HIKE? THE FIRST CUT?',
   'PRICE STABILITY, EVENTUALLY','EIGHT MEETINGS A YEAR'],
  cold:['THE PRINTER COOLS','QT GRINDS ON','THE PUNCHBOWL IS GONE','LIQUIDITY LEAVES QUIETLY',
   'RESERVES RUN THIN','THE FED PUT IS DEAD','NO ONE BIDS THE LONG END','BALANCE SHEET ON A DIET',
   'HAWKS ALL THE WAY DOWN','AMPLE, FOR NOW']},
 ticks:{
  hot:['B/S $8.97T ▲ +112% SINCE 2020','FFR 0.00–0.25 · REAL YIELDS NEGATIVE','QE $120B/MO · RRP $0',
   '10Y 0.62% · VIX 12 · EVERYTHING ▲','REPO CALM · SPREADS CRUSHED'],
  mid:['FED · B/S BAND 6.55–8.97T (FROZEN)','FFR 3.75% · DOTS SCATTER','H.4.1 · WEDNESDAYS 16:30 ET',
   'CPI 2.6% · CORE 2.9% · PCE 2.4%','FOMC ×8/YR · MINUTES +3W'],
  cold:['B/S $6.71T ▼ · QT CONTINUES','LIQUIDITY −$2.3T OFF PEAK','RRP $6B · RESERVES "AMPLE?"',
   '10Y 4.21% · TERM PREMIUM RETURNS','TGA REFILL DRAINS $300B','BANK TERM FUNDING: CLOSED']},
 stamps:{
  hot:['$9T','0.00%','∞','+112%'],
  mid:['6.71T','3.75%','DOTS','?','×8'],
  cold:['QT','▼','−$2.3T','AMPLE?']},
 quotes:{
  hot:['“not even thinking about thinking about raising rates”','“inflation is transitory”',
   '“we have the tools”','“whatever it takes”'],
  mid:['“data dependent”','“policy is in a good place”','“neutral is a concept, not a number”'],
  cold:['“some pain ahead”','“higher for longer”','“the disinflationary process has begun” — again',
   '“no one rings a bell at the bottom of liquidity”']},
 pageidx:{
  hot:'MARKETS B1 · RATES C1 · OPINION A19 · MANSIONS D4',
  mid:'MARKETS B1 · RATES C1 · OPINION A19 · OBITUARIES D7',
  cold:'MARKETS B1 · RATES C1 · BANK FAILURES D2 · OBITUARIES D7'},
 corpus:{
  hot:'The printer hums in the basement of everything. Money costs nothing and therefore everything costs anything; '
   +'cap rates compress, junk yields vanish, a jpeg clears at the price of a house. The committee buys bonds the way '
   +'weather happens — vast, impersonal, weekly. Skeptics talk about consequences; the tape talks louder. Liquidity '
   +'is a tide that believes itself to be a sea.',
  mid:'Eight meetings a year, a scatter of dots, a podium and a thousand readings of the word patient. Policy works '
   +'with long and variable lags, which is to say nobody knows; the chair says data dependent and the market hears '
   +'whatever it brought into the room. Somewhere between transitory and entrenched, between soft landing and the '
   +'other kind, the balance sheet breathes.',
  cold:'Liquidity leaves the way it came, only quieter. Every Wednesday at four-thirty the sheet is a little thinner, '
   +'a few billion of belief allowed to mature and die unreplaced. Reserves are ample until the morning a repo desk '
   +'says otherwise. The punchbowl is gone and the party guests are checking coat-room tickets for collateral. The '
   +'printer is not off. It is listening.'},
 sect:[['10Y',4.2],['2Y',3.8],['DXY',103],['SPX',6800],['GOLD',3300],['OIL',71]],
 earn:[['B/S',6.71,0.05,'T'],['TSY',4.47,0.05,'T'],['MBS',1.97,0.02,'T'],
       ['FFR',3.75,0.25,'%'],['RRP',6,4,'B'],['TGA',876,40,'B']]},
vitalik:{
 name:'Vitalik Buterin',ticker:'ETH',low:1388.12,high:4955.90,ath:'4,955.90',copy:'GAS 12 GWEI',
 bubbleRow:['THE WORLD COMPUTER','20__','2026'],
 logo:{kind:'eth'},logoBias:0.85,                            // ETH-серия — много диамантов/графики
 heads:{
  hot:['ETHEREUM EATS WALL STREET','ULTRASOUND MONEY','THE WORLD COMPUTER BOOTS','BLACKROCK STAKES',
   'GAS AT 200 GWEI AND NOBODY CARES','STAKING YIELD BEATS BONDS','THE FLIPPENING WATCH','REAL ESTATE, ON-CHAIN',
   'L2s ALL THE WAY UP','EVERY BANK RUNS A VALIDATOR','TOKENIZE EVERYTHING','THE MERGE WAS JUST THE START',
   'ETH IS THE BASE LAYER OF MONEY','DEFI SUMMER, FOREVER','THE TRIPLE HALVING','THE END OF THE DOLLAR',
   'NFTs ARE BACK, OBVIOUSLY','SOVEREIGN ROLLUPS','RESTAKE EVERYTHING','THE ETHEREALIZATION OF VALUE'],
  mid:['WHAT IS ETH, LEGALLY?','PROTOCOL OR CASINO?','SCALING SOON™','THE ROADMAP CURVES AGAIN',
   'VITALIK SELLS? VITALIK SELLS.','DECENTRALIZED ENOUGH?','IS THE MERGE PRICED IN, STILL?',
   'WHO PAYS FOR BLOCKSPACE?','A COMPUTER IN SEARCH OF A PROBLEM','SECURITY OR COMMODITY?',
   'THE DANKSHARDING DECADE','SUFFICIENTLY DECENTRALIZED?','GAS FEES, EXPLAINED AGAIN','TOO MANY L2s?'],
  cold:['GAS 2 GWEI: NOBODY LEFT','TVL EVAPORATES','THE FLIPPENING, INVERTED','STAKERS UNSTAKE',
   'L2s GO DARK','WORLD COMPUTER, SLEEP MODE','DEFI WINTER IS HERE','SUPPLY ULTRASOUND, DEMAND UNSOUND',
   'THE CHAIN IS FINE. THE PRICE IS NOT.','EXIT LIQUIDITY, FINALIZED','THE MEMPOOL IS A GRAVEYARD',
   'VALIDATORS EXIT THE QUEUE','RESTAKING UNWINDS','THE WORLD COMPUTER IDLES','BLOCKSPACE, FOR FREE NOW']},
 ticks:{
  hot:['ETH 4,955 ▲ +6.2% · GAS 142 GWEI','STAKED 34.2M ETH · YIELD 5.1%','TVL $184B ▲ · L2 TPS 4,800',
   'BURN > ISSUANCE · SUPPLY ▼','ETH/BTC 0.081 ▲ · FLIPPENING 61%','OPT FLOW ▲ CALLS 74% · IV 88'],
  mid:['ETH · 52W 1,388.12–4,955.90','STAKED 34.2M · VALIDATORS 1.07M','GAS 14 GWEI · BLOBS 6/BLOCK',
   'TVL $94B · DEX 7D $41B','ETH/BTC 0.034 · FLIPPENING 29%','FUNDING 0.00% · OI FLAT'],
  cold:['ETH 1,670 ▼ −41% YOY','GAS 3 GWEI · MEMPOOL EMPTY','TVL $48B ▼ · OUTFLOWS 9 WEEKS',
   'UNSTAKE QUEUE 18 DAYS','ETH/BTC 0.022 ▼ · LOWEST SINCE 2020','OPT FLOW ▼ PUTS 79% · IV 120']},
 stamps:{
  hot:['Ξ','4,955','5.1%','+62%','GWEI','∞/∞'],
  mid:['Ξ','1,388','52W','0.034','?'],
  cold:['Ξ','1,670','−41%','▼','2 GWEI','UNSTAKE']},
 quotes:{
  hot:['“ultrasound money”','“the world computer”','“yield is the new hodl”','“code is law, again”'],
  mid:['“the roadmap remains intact”','“decentralization is a spectrum”','“l2s are ethereum”'],
  cold:['“the chain worked exactly as designed”','“i sold at the top” — nobody','“funds are safu”',
   '“price is the last metric that matters” — holder of last metrics']},
 pageidx:{
  hot:'MARKETS B1 · PROTOCOLS C1 · OPINION A19 · DIGITAL ART D4',
  mid:'MARKETS B1 · PROTOCOLS C1 · OPINION A19 · OBITUARIES D7',
  cold:'MARKETS B1 · LIQUIDATIONS C1 · ABANDONED CHAINS D2 · OBITUARIES D7'},
 corpus:{
  hot:'Blockspace is the scarcest real estate on earth and every block is an auction for the future. Banks that '
   +'laughed now run validators in the same towers where they shorted it. The burn outruns issuance and the supply '
   +'curve bends like spacetime. Somewhere a teenager stakes a house deposit and the yield arrives every twelve '
   +'seconds, trustless, relentless, sincere.',
  mid:'The protocol ships, the price shrugs. Roadmaps fold into roadmaps: rollups, blobs, danksharding, names that '
   +'sound like weather systems. The founder gives away half his net worth and reads philosophy on planes. Whether '
   +'this is the financial system being rebuilt or a very elaborate seminar depends on who you ask and when.',
  cold:'Gas at two gwei is not efficiency, it is silence. The validators hum to an empty mempool like streetlights '
   +'over an evacuated city. TVL leaves in lots of eight figures; the bridges echo. The chain finalizes perfectly, '
   +'block after block of almost nothing, a world computer running screensavers. The technology was never the '
   +'question. The question was always the bid.'},
 sect:[['BTC',74300],['SOL',88],['BNB',520],['ARB',0.4],['OP',0.8],['LDO',1.1],['UNI',6.2]],
 earn:[['GAS',14,18,' GWEI'],['STAKED',34.1,0.4,'M ETH'],['TVL',48,12,'B'],
       ['BURNED',4.6,0.2,'M ETH'],['VALIDATORS',1.07,0.05,'M'],['L2 TPS',310,300,'']],
 glitch:{words:['Ξ','ETH','GWEI','TVL','MERGE','L2','1,670','4,955','STAKE','GAS','0.022'],
  heads:['ULTRASOUND MONEY','GAS 2 GWEI: NOBODY LEFT','THE FLIPPENING, INVERTED','WORLD COMPUTER, SLEEP MODE',
   'PROTOCOL OR CASINO?','VITALIK SELLS? VITALIK SELLS.','TVL EVAPORATES','SCALING SOON™'],
  ticks:['ETH 1,670 ▼ −41% YOY','GAS 3 GWEI · MEMPOOL EMPTY','STAKED 34.2M · VALIDATORS 1.07M',
   '52W 1,388.12–4,955.90','ETH/BTC 0.022 ▼','UNSTAKE QUEUE 18 DAYS']}},
gates:{
 name:'Bill Gates',ticker:'MSFT',low:356.28,high:555.45,ath:'555.45',copy:'640K OUGHT TO BE ENOUGH',
 bubbleRow:['THE SOFTWARE EMPIRE','20__','2000'],
 heads:{
  hot:['MICROSOFT EATS THE CLOUD','A PC ON EVERY DESK','THE AI COPILOT ERA','WINDOWS EVERYWHERE',
   'EMBRACE, EXTEND, EXTINGUISH','THE TRILLION-DOLLAR OS','AZURE TO INFINITY','SOFTWARE IS EATING SOFTWARE',
   'THE RICHEST MAN ON EARTH, AGAIN','EVERY ENTERPRISE RUNS WINDOWS'],
  mid:['IS THE MONOPOLY BACK?','ANTITRUST, AGAIN?','WHAT IS A COMPUTER FOR?','THE CLOUD OR THE COURTROOM?',
   'GATES GIVES IT AWAY','IS AI THE NEW WINDOWS?','THE LAST GREAT MONOPOLY','HOW MUCH IS TOO BIG?',
   'PLATFORM OR PRISON?','640K, REVISITED'],
  cold:['THE EMPIRE COOLS','DOT-COM, AGAIN?','THE LOST DECADE RETURNS','AZURE GROWTH STALLS',
   'BREAK IT UP','THE OS OF A SLOWER WORLD','COPILOT, GROUNDED','LEGACY IS A LIABILITY',
   'THE MONOPOLY THAT FORGOT TO INNOVATE','WHERE DID THE GROWTH GO?']},
 ticks:{
  hot:['MSFT 555.45 ▲ ATH · MKT CAP $4.1T','AZURE +31% YOY · COPILOT SEATS 90M','CLOUD GROSS MARGIN 71%',
   'P/E 38 · FWD P/E 32 · DIV 0.7%','AI CAPEX $80B/YR · GPUs ▲','OFFICE 400M SEATS · WINDOWS 1.4B'],
  mid:['NASDAQ: MSFT · 52W 356.28–555.45','MSFT 410.00 ▼ −14% YOY','AZURE +18% · DECELERATING',
   'P/E 31 · BUYBACK $60B','EPS 12.40 · FCF $74B','ENTERPRISE SEATS FLAT'],
  cold:['MSFT 356.28 ▼ −36% OFF HIGH','AZURE +6% · CLOUD WINTER','CAPEX WRITEDOWNS · AI OVERBUILT',
   'P/E 19 · MULTIPLE COMPRESSES','LAYOFFS 14,000 · REORG','GROWTH STOCK NO MORE']},
 stamps:{
  hot:['$4T','ATH','+31%','640K','×100'],
  mid:['356','P/E 31','52W','?','410'],
  cold:['−36%','▼','BREAK','356.28','SLOW']},
 quotes:{
  hot:['“a computer on every desk and in every home”','“we always overestimate the change in two years”',
   '“software is a great combination of artistry and engineering”','“your most unhappy customers are your greatest source of learning”'],
  mid:['“640K ought to be enough for anybody”','“i choose a lazy person to do a hard job”',
   '“success is a lousy teacher”','“the internet is becoming the town square”'],
  cold:['“we always underestimate the change in ten years”','“this is a temporary setback”',
   '“legacy is a dangerous word”','“the monopoly was the easy part”']},
 pageidx:{
  hot:'MARKETS B1 · TECH C3 · OPINION A19 · PHILANTHROPY D4',
  mid:'MARKETS B1 · TECH C3 · ANTITRUST C9 · OBITUARIES D7',
  cold:'MARKETS B1 · LAYOFFS C1 · ANTITRUST C9 · OBITUARIES D7'},
 corpus:{
  hot:'It started in a garage and ended up in every pocket, every desk, every server farm on earth. The empire '
   +'embraces, extends, and quietly extinguishes; the courtroom comes and goes and the licensing revenue never '
   +'stops. Now the same company that sold you an operating system sells you a copilot, and the cloud bills arrive '
   +'monthly, eternal, accretive. Skeptics called the top for thirty years and the cash kept compounding.',
  mid:'Somewhere between the antitrust trial and the foundation there is still a software business, vast and warm, '
   +'humming under fluorescent lights. The founder gives away his fortune and reads about malaria on planes. Whether '
   +'this is the most durable monopoly ever built or a legacy waiting to be disrupted depends on which quarter you '
   +'read and how you feel about the cloud.',
  cold:'Every empire has its lost decade, and the market is reading the old script again. Azure grows in single '
   +'digits, the capex writedowns arrive, and a growth stock quietly becomes a value trap. The same analysts who '
   +'modeled seats now model break-ups. The software still runs the world; the multiple no longer believes it.'},
 sect:[['AAPL',210],['GOOG',180],['AMZN',190],['NVDA',120],['ORCL',140],['CRM',230]],
 earn:[['REV',62,5,'B'],['CLOUD',28,3,'B'],['OP INC',27,3,'B'],['EPS',12.4,1,''],['BUYBACK',60,5,'B'],['CAPEX',80,10,'B']]},
zuck:{
 name:'Mark Zuckerberg',ticker:'META',low:520.26,high:796.25,ath:'796.25',copy:'MOVE FAST',
 bubbleRow:['THE METAVERSE','20__','2022'],
 heads:{
  hot:['META EATS THE FUTURE','THE METAVERSE IS HERE','SUPERINTELLIGENCE, SOON','LEGS, FINALLY',
   'AI GLASSES FOR EVERYONE','THE YEAR OF EFFICIENCY PAYS OFF','5 BILLION USERS AND COUNTING','OPEN SOURCE WINS',
   'ADS ARE INFINITE','MOVE FAST AND PRINT MONEY'],
  mid:['IS THE METAVERSE REAL?','HOW MANY BILLIONS ON LEGS?','PIVOT NUMBER FOUR','THE PRIVACY QUESTION, AGAIN',
   'AVATAR OR APPARITION?','WHO ASKED FOR THIS?','REALITY LABS: HOW LONG?','A SOCIAL NETWORK, STILL?',
   'THE TOLL ON ATTENTION','OPEN OR JUST FREE?'],
  cold:['REALITY LABS LOSES ANOTHER BILLION','THE METAVERSE IS EMPTY','PIVOT, AGAIN','THE LEGS WERE A LIE',
   'AI CAPEX, UNANSWERED','EFFICIENCY MEETS GRAVITY','NOBODY LOGS ON','THE TOLL IS DUE',
   'A GHOST TOWN IN 3D','WHERE DID THE USERS GO?']},
 ticks:{
  hot:['META 796.25 ▲ ATH · MKT CAP $2.0T','DAU 3.4B ▲ · ARPU $14.20','AI CAPEX $65B/YR · GPUs 600K',
   'P/E 29 · OP MARGIN 42%','REALITY LABS −$4.5B/Q · "INVESTING"','REELS ▲ · ENGAGEMENT ▲'],
  mid:['NASDAQ: META · 52W 520.26–796.25','META 568.00 ▼ −12% OFF HIGH','DAU 3.3B · ARPU FLAT',
   'P/E 24 · BUYBACK $50B','EPS 23.10 · FCF $52B','RL BURN $40B CUMULATIVE'],
  cold:['META 520.26 ▼ −35% OFF HIGH','RL LOSSES $20B/YR · NO PRODUCT','AD PRICES ▼ · ENGAGEMENT ▼',
   'P/E 13 · MULTIPLE HALVES','LAYOFFS 21,000 · "FLATTENING"','THE METAVERSE: WROTE OFF']},
 stamps:{
  hot:['$2T','ATH','3.4B','LEGS','∞'],
  mid:['520','P/E 24','52W','?','568'],
  cold:['−35%','▼','−$20B','EMPTY','520']},
 quotes:{
  hot:['“the metaverse is the next chapter”','“move fast and break things”','“we’re building the future”',
   '“i think we should be optimistic”'],
  mid:['“senator, we run ads”','“it’s a marathon, not a sprint”','“this is the year of efficiency”'],
  cold:['“we remain committed to reality labs”','“the legs are coming”','“temporary headwinds”',
   '“no one could have predicted users wouldn’t come”']},
 pageidx:{
  hot:'MARKETS B1 · TECH C3 · OPINION A19 · YACHTS D4',
  mid:'MARKETS B1 · TECH C3 · PRIVACY C9 · OBITUARIES D7',
  cold:'MARKETS B1 · LAYOFFS C1 · PRIVACY C9 · OBITUARIES D7'},
 corpus:{
  hot:'He renamed the company after the thing he was sure came next, and the market clapped. Billions flow into '
   +'headsets nobody wears and avatars nobody asked for, and the ad machine in the basement pays for all of it, '
   +'relentless, frictionless, infinite. Move fast, the wall used to say. Now it says superintelligence. The toll '
   +'on attention is collected in milliseconds, three billion times a day.',
  mid:'Somewhere under the pivots there is still the most efficient attention-harvesting machine ever built, warm '
   +'and quiet and enormous. The founder testifies, apologizes, rebrands, and ships. Whether the metaverse is the '
   +'future of human connection or a very expensive screensaver depends on who you ask and which keynote you watched.',
  cold:'Reality Labs loses another billion into a world with no weather and no people. The legs arrived a year late '
   +'and walked into an empty room. The same machine that prints money on ads now writes off the future it promised. '
   +'Move fast, the wall said; gravity, it turns out, moves faster.'},
 sect:[['GOOG',180],['SNAP',9],['PINS',32],['RDDT',120],['NVDA',120],['APP',310]],
 earn:[['REV',42,4,'B'],['ADS',40,4,'B'],['RL LOSS',-4.5,1,'B'],['OP MARGIN',42,4,'%'],['EPS',23.1,2,''],['CAPEX',65,8,'B']]}
};
