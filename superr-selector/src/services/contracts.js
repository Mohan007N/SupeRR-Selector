/**
 * Data contracts between the React UI and the (future) FastAPI backend.
 *
 * The demo service in src/data/mockService.js and the HTTP service in
 * src/services/httpApi.js both return exactly these shapes. Swapping one for
 * the other never requires UI changes.
 *
 * All endpoints accept the same filter query parameters:
 *   competition = All | IPL | T20I
 *   season      = All | 2019 ... 2025
 *   date_from   = YYYY-MM-DD (optional)
 *   date_to     = YYYY-MM-DD (optional)
 *
 * @typedef {Object} Filters
 * @property {'All'|'IPL'|'T20I'} competition
 * @property {'All'|number|string} season
 * @property {string} dateFrom
 * @property {string} dateTo
 *
 * @typedef {Object} Meta
 * @property {boolean} isDemo        true when the figures are synthetic. The UI shows a demo label whenever this is true.
 * @property {string}  source        Free-text provenance, e.g. "synthetic-demo-data" or "ballbyball-2025-v3".
 * @property {string}  generatedAt   ISO timestamp.
 * @property {string=} notice        Optional message shown next to the data.
 *
 * @typedef {'High'|'Medium'|'Low'} Confidence
 *
 * @typedef {Object} BattingRow            GET /batting
 * @property {string} id
 * @property {'batting'} type
 * @property {string} name
 * @property {string[]} teams
 * @property {string[]} competitions
 * @property {number} matches
 * @property {number} runs
 * @property {number} balls
 * @property {number} dismissals
 * @property {number|null} strikeRate            runs per 100 balls
 * @property {number|null} average               runs per dismissal
 * @property {number|null} boundaryPct           % of balls that were 4s or 6s
 * @property {number|null} dismissalRate         dismissals per 100 balls
 * @property {number} pressureBalls
 * @property {number} normalBalls
 * @property {number|null} pressureStrikeRate
 * @property {number|null} normalStrikeRate
 * @property {number|null} pressureImprovement   pressureStrikeRate - normalStrikeRate
 * @property {number|null} rating                0-100, 50 = league average. See methodology.
 * @property {number} reliability                0-100, pressureBalls / (pressureBalls + prior)
 * @property {Confidence} confidence
 *
 * @typedef {Object} BowlingRow            GET /bowling
 * @property {string} id
 * @property {'bowling'} type
 * @property {string} name
 * @property {string[]} teams
 * @property {string[]} competitions
 * @property {number} matches
 * @property {number} wickets
 * @property {number} legalBalls
 * @property {number|null} economy
 * @property {number|null} wicketRate            wickets per 24 legal balls
 * @property {number|null} dotPct
 * @property {number|null} boundaryPctConceded
 * @property {number} pressureBalls
 * @property {number|null} pressureEconomy
 * @property {number|null} normalEconomy
 * @property {number|null} improvement           normalEconomy - pressureEconomy (positive = better under pressure)
 * @property {number|null} rating
 * @property {number} reliability
 * @property {Confidence} confidence
 *
 * @typedef {Object} PlayerTableResponse   GET /batting, GET /bowling
 * @property {Meta} meta
 * @property {'batting'|'bowling'} type
 * @property {Object} baseline             pooled league baseline for the current filters
 * @property {(BattingRow|BowlingRow)[]} rows
 * @property {number} matchesInScope
 *
 * @typedef {Object} LeaderboardResponse   GET /rankings/{type}?min_pressure_balls=&confidence=
 * @property {Meta} meta
 * @property {'batting'|'bowling'} type
 * @property {((BattingRow|BowlingRow) & {rank:number})[]} rows   top 10 only
 * @property {number} eligibleCount
 * @property {number} totalCount
 * @property {number} minPressureBalls
 *
 * @typedef {Object} PlayerProfileResponse GET /players/{type}/{id}
 * @property {Meta} meta
 * @property {{id:string,type:string,name:string,teams:string[],competitions:string[]}} player
 * @property {boolean} hasData
 * @property {Object=} metrics             same fields as BattingRow / BowlingRow
 * @property {{key:string,label:string,unit:string,digits:number,higherIsBetter:boolean,pressure:number|null,normal:number|null}[]=} pressureVsNormal
 * @property {{season:number,pressure:number|null,normal:number|null,matches:number}[]=} bySeason
 * @property {Object[]=} matchLog          chronological, one entry per match
 * @property {{mean:number,standardDeviation:number,coefficientOfVariation:number|null,thresholdLabel:string,thresholdPct:number,sample:number}|null=} consistency
 *
 * @typedef {Object} ComparisonResponse    GET /comparison/{type}?a=&b=
 * @property {Meta} meta
 * @property {{id:string,name:string,hasData:boolean,row:Object|null}} a
 * @property {{id:string,name:string,hasData:boolean,row:Object|null}} b
 * @property {{key:string,label:string,digits:number,higherIsBetter:boolean|null,a:number|null,b:number|null,winner:'a'|'b'|'tie'|null}[]} table
 * @property {{axis:string,a:number,b:number}[]} radar   percentiles 0-100 against the analysed pool
 * @property {number} radarPoolSize
 *
 * @typedef {Object} OverviewResponse      GET /overview
 * @property {Meta} meta
 * @property {{matches:number,players:number,batters:number,bowlers:number,pressureDeliveries:number,pressureDeliveriesBowled:number,competitions:string[]}} kpis
 * @property {{batting:{group:string,pressure:number|null,normal:number|null}[],bowling:{group:string,pressure:number|null,normal:number|null}[]}} pressureVsNormal
 * @property {{season:number,battingPressure:number|null,battingNormal:number|null,bowlingPressure:number|null,bowlingNormal:number|null}[]} seasonTrend
 * @property {{name:string,matches:number,players:number,pressureDeliveries:number}[]} competitionDistribution
 * @property {{batters:Object[],bowlers:Object[]}} topPerformers
 * @property {{id:string,tone:'positive'|'neutral'|'caution',title:string,body:string,playerRef?:{type:string,id:string}}[]} insights
 *
 * @typedef {Object} PressureBinsResponse  GET /pressure/bins?competition=
 * @property {Meta} meta
 * @property {Object} defaults             default pressure configuration (weights and thresholds per innings)
 * @property {{innings:'first'|'second',competition:string,over:number,wicketsLost:number,rate:number,count:number}[]} bins
 *
 * @typedef {Object} MethodologyResponse   GET /methodology
 * @property {Meta} meta
 * @property {string} version
 * @property {Object} parameters
 * @property {Object[]} competitionComparison
 *
 * @typedef {Object} FilterOptionsResponse GET /filters
 * @property {Meta} meta
 * @property {string[]} competitions
 * @property {number[]} seasons
 * @property {{min:string,max:string}} dateBounds
 *
 * @typedef {Object} PlayerDirectoryResponse GET /players
 * @property {Meta} meta
 * @property {{id:string,type:'batting'|'bowling',name:string,teams:string[],competitions:string[]}[]} players
 */

export const CONTRACT_VERSION = '1.0.0'
