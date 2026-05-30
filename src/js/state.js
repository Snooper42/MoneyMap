/* MoneyMap state constants and mutable app state.
   Split from the former single app.js without changing stored data shape. */

const STORAGE_KEY = window.MoneyMapConfig?.storageKey || 'moneymap_v1';
const OLD_STORAGE_KEYS = ['moneymap_sick_v1'];
const APP_BUILD_ID = window.MoneyMapConfig?.buildId || 'v0.1.10';
let storageWriteFailed = false;
let storageWarningShown = false;
let storageMigrationNotice = null;
const COLORS = ['#1aa6b7','#7556d9','#f2bd2e','#e86f31','#46a758','#d84f68','#7c8b9a','#9b744e'];
let creditChartHoverIndex=null;
let creditChartModel=null;
const CATEGORIES = ['Income','Groceries','Dining','Coffee','Gas','Transportation','Shopping','Bills','Housing','Subscriptions','Health','Fitness','Entertainment','Travel','Education','Debt Payment','Savings','Investments','Transfers','Other'];
const NAV = [
  ['overview','Overview','Command center','⌁'],['import','Import','CSV dropzone','⇡'],['review','Review','Weekly cleanup','✓'],['transactions','Transactions','Search and edit','≡'],['budgets','Budgets','Monthly limits','◌'],['recurring','Subscriptions','Recurring charges','↻'],['networth','History','Snapshots','◆'],['debt','Debt','Payoff plan','◒'],['investments','Investments','Holdings','△'],['credit','Credit','Score history','◧'],['goals','Goals','Targets','◇'],['rules','Rules','Auto cleanup','⚡'],['settings','Settings','Local app','⚙']
];
const defaultState = {
  version: 13,
  theme: 'light',
  appearance: { theme:'light', accent:'sunset', density:'compact', vibe:'minimal' },
  settings: { currency:'USD', showCents:false, incomeTarget:0, lastBackup:null, lastRestore:null, welcomeMode:'auto', firstRunComplete:false, startupSeenBuild:'', uiPolishV48:false, uiUsabilityV49:false, homeTiles:{intro:true, score:true}, uiParityV52:false, dashboardDensity:'balanced', commandPaletteSeen:false, mobileNavItems:null },
  automation: { transferDetection:true, subscriptionDetection:true, ruleSuggestions:true, merchantCleanup:true },
  trackerSettings: { debtStrategy:'avalanche', creditTarget:760, creditCadence:'monthly' },
  transactions: [], rules: [], merchantRules: [], budgets: [], goals: [], accounts: [], netWorthHistory: [], debts: [], holdings: [], creditHistory: [], imports: [], importMappings: [], recurring: [], categoryStatus: {},
};
let state = null;
let activeView = 'overview';
let pendingImport = null;
let reviewIndex = 0;
let chartsReady = false;
