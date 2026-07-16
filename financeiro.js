const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const WEEKDAY = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });
const STORE_KEY = "financeiro-consignado-v1";
const BACKUP_KEY = "financeiro-consignado-backup-v1";
const DELETED_SALES_KEY = "financeiro-consignado-vendas-apagadas-v1";
const SESSION_KEY = "financeiro-consignado-session-v1";
const DATA_VERSION = 10;
const SUPABASE_URL = "https://ziennndoyekvguymsbap.supabase.co";
const SUPABASE_KEY = "sb_publishable_aWQWtwt359ZHxHD0uf4HKQ_Sjilej57";
const SUPABASE_STATE_ENDPOINT = `${SUPABASE_URL}/rest/v1/financeiro_app_state`;
const WORKING_CAPITAL = 17148;
const WORKING_CAPITAL_GOAL = 25000;
const HAS_SAVED_STATE = Boolean(localStorage.getItem(STORE_KEY));
const CASH_TO_CAPITAL_TRANSFER_ID = "ALLOC-FECHAMENTO-CAIXA-GIRO-20260707";
const EXTRA_WORKING_CAPITAL_ID = "ALLOC-GIRO-EXTRA-12282-20260707";
const EXTRA_WORKING_CAPITAL_AMOUNT = 12282;
const LAST_WEEK_ARCHIVE_ID = "FECHAMENTO-SEMANA-PASSADA-20260707";
const GENERAL_LINE_RATE = 40;
const LINE_1_RATE = 15;
const LINE_2_RATE = 25;
const MOTIVATIONAL_MESSAGES = [
  "Seu resultado e reflexo da sua dedicacao. Continue avancando!",
  "Cada venda e mais um passo rumo aos seus objetivos.",
  "Disciplina, foco e constancia constroem grandes resultados.",
  "Parabens pelo trabalho. Que a proxima venda seja ainda maior!",
  "Seu esforco gera resultado. Continue fazendo acontecer!",
  "Grandes conquistas comecam com a coragem de tentar todos os dias.",
  "Quem trabalha com proposito transforma metas em realidade.",
  "Mais uma conquista registrada. O melhor ainda esta por vir!",
  "Sua persistencia faz a diferenca. Continue firme!",
  "Resultados fortes nascem de atitudes consistentes.",
  "Voce esta construindo seu sucesso uma venda de cada vez.",
  "Meta cumprida e motivacao renovada. Vamos para a proxima!",
];
let lastMotivationalMessage = "";
const USERS = {
  universo: { password: "@universo00", role: "socio_adm", label: "Socio ADM" },
  mm: { password: "@Universo777", role: "socio_mm", label: "Socio MM" },
  financeiro: { password: "@Financeiro00", role: "financeiro" },
  wg: { password: "@wg01", role: "visualizador", label: "Visualizador" },
};
const SALE_FORMATS = {
  standard: "Imposto 35%",
  machine: "NFC",
  bank40: "Imposto 40%",
  bank40Special: "40% especial",
};

const defaults = {
  dataVersion: DATA_VERSION,
  weeklyClosedAt: null,
  workingCapitalBalance: WORKING_CAPITAL,
  weekArchives: [],
  firmAllocations: [],
  settings: {
    bankTaxRate: 35,
    firmCashRate: 10,
    line1Rate: 15,
    line2Rate: 25,
    line2With3Rate: 20,
    line3Rate: 15,
  },
  agents: [
    { id: "AG001", name: "Agente 1", sector: "1 Linha", active: true },
    { id: "AG002", name: "Agente 2", sector: "2 Linha", active: true },
    { id: "AG003", name: "Agente 3", sector: "3 Linha", active: true },
  ],
  sales: [
    {
      id: crypto.randomUUID(),
      date: "2026-06-22",
      client: "Cliente exemplo",
      agentIds: ["AG001", "AG002"],
      amount: 20000,
      format: "standard",
      status: "Pago",
      notes: "Venda modelo",
      calculationSnapshot: null,
    },
  ],
  expenses: [
    {
      id: crypto.randomUUID(),
      date: "2026-06-22",
      description: "Despesa exemplo",
      amount: 500,
      status: "Pago",
      paidDate: "2026-06-22",
    },
  ],
};

let state = loadState();
migrateLoanGroups();
migrateCalculationSnapshots();
ensureAgentSectors(["2D", "LOIRA"], ["1 Linha", "2 Linha", "3 Linha"]);
applyDataMigrations();
let deferredInstallPrompt = null;
let cloudSyncEnabled = false;
let cloudSaveTimer = null;
let cloudLoadPromise = null;

const el = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginUser: document.querySelector("#loginUser"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  installAppBtn: document.querySelector("#installAppBtn"),
  bankApp: document.querySelector(".bank-app"),
  totalSold: document.querySelector("#totalSold"),
  netCompany: document.querySelector("#netCompany"),
  firmCash: document.querySelector("#firmCash"),
  totalExpenses: document.querySelector("#totalExpenses"),
  cashBalance: document.querySelector("#cashBalance"),
  workingCapital: document.querySelector("#workingCapital"),
  menuCashBalance: document.querySelector("#menuCashBalance"),
  payableCommission: document.querySelector("#payableCommission"),
  totalTax: document.querySelector("#totalTax"),
  weeklyPeriod: document.querySelector("#weeklyPeriod"),
  weeklySalesTotal: document.querySelector("#weeklySalesTotal"),
  weeklyExpensesTotal: document.querySelector("#weeklyExpensesTotal"),
  weeklyPendingExpensesTotal: document.querySelector("#weeklyPendingExpensesTotal"),
  weeklyBalance: document.querySelector("#weeklyBalance"),
  weeklyDailyFeed: document.querySelector("#weeklyDailyFeed"),
  salePreview: document.querySelector("#salePreview"),
  simulationForm: document.querySelector("#simulationForm"),
  simulationAmount: document.querySelector("#simulationAmount"),
  simulationFormat: document.querySelector("#simulationFormat"),
  simulationSellers: document.querySelector("#simulationSellers"),
  simulationPreview: document.querySelector("#simulationPreview"),
  simulationResult: document.querySelector("#simulationResult"),
  previewTax: document.querySelector("#previewTax"),
  previewMachineFee: document.querySelector("#previewMachineFee"),
  previewFirmCash: document.querySelector("#previewFirmCash"),
  previewBankTaxNet: document.querySelector("#previewBankTaxNet"),
  previewLine1: document.querySelector("#previewLine1"),
  previewLine2: document.querySelector("#previewLine2"),
  previewLine3: document.querySelector("#previewLine3"),
  previewFirm: document.querySelector("#previewFirm"),
  previewTotalFirm: document.querySelector("#previewTotalFirm"),
  saleForm: document.querySelector("#saleForm"),
  saleAmount: document.querySelector("#saleAmount"),
  saleFormat: document.querySelector("#saleFormat"),
  saleAgent1: document.querySelector("#saleAgent1"),
  saleAgent2: document.querySelector("#saleAgent2"),
  saleAgent3: document.querySelector("#saleAgent3"),
  saleStatus: document.querySelector("#saleStatus"),
  saleDate: document.querySelector("#saleDate"),
  saleNotes: document.querySelector("#saleNotes"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseDate: document.querySelector("#expenseDate"),
  expenseDescription: document.querySelector("#expenseDescription"),
  expenseAmount: document.querySelector("#expenseAmount"),
  settingsForm: document.querySelector("#settingsForm"),
  bankTaxRate: document.querySelector("#bankTaxRate"),
  firmCashRate: document.querySelector("#firmCashRate"),
  line1Rate: document.querySelector("#line1Rate"),
  line2Rate: document.querySelector("#line2Rate"),
  line2With3Rate: document.querySelector("#line2With3Rate"),
  line3Rate: document.querySelector("#line3Rate"),
  agentForm: document.querySelector("#agentForm"),
  agentName: document.querySelector("#agentName"),
  agentSector: document.querySelector("#agentSector"),
  agentsList: document.querySelector("#agentsList"),
  agentCount: document.querySelector("#agentCount"),
  agentEditDialog: document.querySelector("#agentEditDialog"),
  agentEditForm: document.querySelector("#agentEditForm"),
  agentEditId: document.querySelector("#agentEditId"),
  agentEditName: document.querySelector("#agentEditName"),
  agentEditSector: document.querySelector("#agentEditSector"),
  agentEditCancel: document.querySelector("#agentEditCancel"),
  agentEditCancelTop: document.querySelector("#agentEditCancelTop"),
  salesCards: document.querySelector("#salesCards"),
  expensesTable: document.querySelector("#expensesTable"),
  expenseCount: document.querySelector("#expenseCount"),
  expensePendingTotal: document.querySelector("#expensePendingTotal"),
  expensePaidTotal: document.querySelector("#expensePaidTotal"),
  expenseCashAvailable: document.querySelector("#expenseCashAvailable"),
  transferCashToCapitalBtn: document.querySelector("#transferCashToCapitalBtn"),
  line1Total: document.querySelector("#line1Total"),
  line2Total: document.querySelector("#line2Total"),
  line3Total: document.querySelector("#line3Total"),
  linePayTotal: document.querySelector("#linePayTotal"),
  linePaymentCount: document.querySelector("#linePaymentCount"),
  linePaymentsTable: document.querySelector("#linePaymentsTable"),
  firmWorkingCapital: document.querySelector("#firmWorkingCapital"),
  firmRemainderTotal: document.querySelector("#firmRemainderTotal"),
  firmCashDetailTotal: document.querySelector("#firmCashDetailTotal"),
  firmExpenseTotal: document.querySelector("#firmExpenseTotal"),
  firmPaidExpenseTotal: document.querySelector("#firmPaidExpenseTotal"),
  firmCashBalanceDetail: document.querySelector("#firmCashBalanceDetail"),
  firmCommissionTotal: document.querySelector("#firmCommissionTotal"),
  firmSaleCount: document.querySelector("#firmSaleCount"),
  firmCommissionCards: document.querySelector("#firmCommissionCards"),
  firmExpenseCount: document.querySelector("#firmExpenseCount"),
  firmExpensesCards: document.querySelector("#firmExpensesCards"),
  firmWorkCount: document.querySelector("#firmWorkCount"),
  firmWorkTotal: document.querySelector("#firmWorkTotal"),
  firmWorkCards: document.querySelector("#firmWorkCards"),
  firmProlaboreMM: document.querySelector("#firmProlaboreMM"),
  firmProlaboreFort: document.querySelector("#firmProlaboreFort"),
  firmAvailableAllocation: document.querySelector("#firmAvailableAllocation"),
  capitalGoalStatus: document.querySelector("#capitalGoalStatus"),
  capitalGoalRemaining: document.querySelector("#capitalGoalRemaining"),
  capitalProgressBar: document.querySelector("#capitalProgressBar"),
  firmAllocationForm: document.querySelector("#firmAllocationForm"),
  firmAllocationType: document.querySelector("#firmAllocationType"),
  firmAllocationAmount: document.querySelector("#firmAllocationAmount"),
  firmAllocationDate: document.querySelector("#firmAllocationDate"),
  firmAllocationNotes: document.querySelector("#firmAllocationNotes"),
  firmAllocationHistory: document.querySelector("#firmAllocationHistory"),
  downloadFirmReceiptBtn: document.querySelector("#downloadFirmReceiptBtn"),
  printFirmReceiptBtn: document.querySelector("#printFirmReceiptBtn"),
  historyStandardTotal: document.querySelector("#historyStandardTotal"),
  historyBank40Total: document.querySelector("#historyBank40Total"),
  historyBank40SpecialTotal: document.querySelector("#historyBank40SpecialTotal"),
  historyMachineTotal: document.querySelector("#historyMachineTotal"),
  historyFirmCashTotal: document.querySelector("#historyFirmCashTotal"),
  historyFirmCashList: document.querySelector("#historyFirmCashList"),
  weekArchiveFilter: document.querySelector("#weekArchiveFilter"),
  proofStatus: document.querySelector("#proofStatus"),
  proofEntry: document.querySelector("#proofEntry"),
  proofTax: document.querySelector("#proofTax"),
  proofPayroll: document.querySelector("#proofPayroll"),
  proofExpenses: document.querySelector("#proofExpenses"),
  proofCash: document.querySelector("#proofCash"),
  proofFirm: document.querySelector("#proofFirm"),
  proofDistributed: document.querySelector("#proofDistributed"),
  proofDifference: document.querySelector("#proofDifference"),
  recoverDeletedSalesBtn: document.querySelector("#recoverDeletedSalesBtn"),
  deleteAllRecordsBtn: document.querySelector("#deleteAllRecordsBtn"),
  statusFilter: document.querySelector("#statusFilter"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  undoResetBtn: document.querySelector("#undoResetBtn"),
  resetDemoBtn: document.querySelector("#resetDemoBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  viewTitle: document.querySelector("#viewTitle"),
};

const viewTitles = {
  dashboard: "Dashboard",
  simulation: "Simulacao de venda",
  sale: "Nova venda",
  expenses: "Despesas",
  linePayments: "Pagamento dos vendedores",
  firmCommission: "Comissao firma",
  history: "Historico",
  settings: "Configuracoes",
};

function loadState() {
  const saved = localStorage.getItem(STORE_KEY);
  if (!saved) return structuredClone(defaults);
  try {
    const parsed = JSON.parse(saved);
    const settings = { ...defaults.settings };
    for (const key of Object.keys(settings)) {
      if (parsed.settings && parsed.settings[key] !== undefined) {
        settings[key] = sanitizeRate(parsed.settings[key]);
      }
    }
    settings.firmCashRate = Math.min(settings.firmCashRate, settings.bankTaxRate);
    const agents = Array.isArray(parsed.agents)
      ? parsed.agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          sector: normalizeSector(agent.sector),
          active: agent.active !== false,
        }))
      : defaults.agents;
    const sales = Array.isArray(parsed.sales)
      ? parsed.sales.map((sale) => ({
          ...sale,
          format: sale.format || "standard",
          status: ["Pago", "Pendente", "Cancelado"].includes(sale.status) ? sale.status : "Pendente",
          agentIds: getUniqueAgentIds(sale.agentIds || [sale.agentId]).slice(0, 3),
          commissionPaidAgentIds: getUniqueAgentIds(sale.commissionPaidAgentIds || []),
        }))
      : defaults.sales;
    const expenses = Array.isArray(parsed.expenses)
      ? parsed.expenses.map((expense) => ({
          ...expense,
          status: expense.status === "Pago" && expense.paidDate ? "Pago" : "Pendente",
        }))
      : [];
    return {
      dataVersion: Number(parsed.dataVersion || 0),
      weeklyClosedAt: parsed.weeklyClosedAt || null,
      workingCapitalBalance: Math.max(0, Number(parsed.workingCapitalBalance ?? 0)),
      weekArchives: Array.isArray(parsed.weekArchives)
        ? parsed.weekArchives.map((archive) => ({
            ...archive,
            sales: Array.isArray(archive.sales) ? archive.sales : [],
            expenses: Array.isArray(archive.expenses) ? archive.expenses : [],
            firmAllocations: Array.isArray(archive.firmAllocations) ? archive.firmAllocations : [],
          }))
        : [],
      firmAllocations: Array.isArray(parsed.firmAllocations)
        ? parsed.firmAllocations.map((allocation) => ({
            ...allocation,
            amount: Math.max(0, Number(allocation.amount || 0)),
          }))
        : [],
      settings,
      agents,
      sales,
      expenses,
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  scheduleCloudSave();
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function hasMeaningfulCloudState(data) {
  return Boolean(
    data &&
      (Array.isArray(data.sales) ||
        Array.isArray(data.expenses) ||
        Array.isArray(data.agents) ||
        Array.isArray(data.weekArchives) ||
        Array.isArray(data.firmAllocations)),
  );
}

function sanitizeForCloud(value) {
  return JSON.parse(JSON.stringify(value));
}

async function loadStateFromCloud() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  if (cloudLoadPromise) return cloudLoadPromise;
  cloudLoadPromise = (async () => {
    try {
      const response = await fetch(`${SUPABASE_STATE_ENDPOINT}?id=eq.main&select=data`, {
        headers: supabaseHeaders({ Accept: "application/json" }),
      });
      if (!response.ok) throw new Error(`Supabase leitura ${response.status}`);
      const rows = await response.json();
      const cloudData = rows?.[0]?.data;
      if (hasMeaningfulCloudState(cloudData)) {
        localStorage.setItem(STORE_KEY, JSON.stringify(cloudData));
        state = loadState();
        migrateLoanGroups();
        migrateCalculationSnapshots();
        ensureAgentSectors(["2D", "LOIRA"], ["1 Linha", "2 Linha", "3 Linha"]);
        applyDataMigrations();
        cloudSyncEnabled = true;
        render();
        return;
      }
      cloudSyncEnabled = true;
      scheduleCloudSave(0);
    } catch (error) {
      console.warn("Nao foi possivel sincronizar com Supabase.", error);
      cloudSyncEnabled = false;
    } finally {
      cloudLoadPromise = null;
    }
  })();
  return cloudLoadPromise;
}

function scheduleCloudSave(delay = 800) {
  if (!cloudSyncEnabled || !SUPABASE_URL || !SUPABASE_KEY) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(saveStateToCloud, delay);
}

async function saveStateToCloud() {
  if (!cloudSyncEnabled || !SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    const response = await fetch(SUPABASE_STATE_ENDPOINT, {
      method: "POST",
      headers: supabaseHeaders({
        Prefer: "resolution=merge-duplicates",
      }),
      body: JSON.stringify({
        id: "main",
        data: sanitizeForCloud(state),
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error(`Supabase gravacao ${response.status}`);
  } catch (error) {
    console.warn("Nao foi possivel salvar no Supabase.", error);
  }
}

function migrateLoanGroups() {
  const groupId = "EMPRESTIMO-90200-20260623";
  const parts = [
    { id: "5997bcd3-ddf9-4b57-80ca-91c416c6ac83", amount: 39900 },
    { id: "abea260d-df10-471c-af9a-911a9de06b60", amount: 21000 },
    { id: "6c6662d5-d7fe-40c4-86fd-e5112bc94a17", amount: 29300 },
  ];
  const commonAgentIds = ["AG003", "AG009"];
  let changed = false;

  parts.forEach((part, index) => {
    const sale = state.sales.find((item) => item.id === part.id);
    if (!sale) return;
    const agentsChanged = JSON.stringify(sale.agentIds) !== JSON.stringify(commonAgentIds);
    if (
      sale.amount !== part.amount ||
      sale.loanGroupId !== groupId ||
      sale.loanPart !== index + 1 ||
      agentsChanged
    ) {
      sale.amount = part.amount;
      sale.agentIds = [...commonAgentIds];
      sale.loanGroupId = groupId;
      sale.loanPart = index + 1;
      sale.loanGroupLabel = "Emprestimo R$ 90.200,00";
      delete sale.calculationSnapshot;
      changed = true;
    }
  });

  if (changed) saveState();
}

function migrateCalculationSnapshots() {
  let changed = false;
  state.sales.forEach((sale) => {
    if (!sale.calculationSnapshot || sale.calculationSnapshot.snapshotVersion !== 5) {
      sale.calculationSnapshot = calculateSale(sale, false);
      changed = true;
    }
  });
  if (changed) saveState();
}

function currentSession() {
  return sessionStorage.getItem(SESSION_KEY);
}

function currentRole() {
  return USERS[currentSession()]?.role || "";
}

function isAdmin() {
  return ["socio_adm", "socio_mm"].includes(currentRole());
}

function canManagePayments() {
  return isAdmin() || currentRole() === "financeiro";
}

function setLoggedView() {
  const logged = Boolean(currentSession());
  el.loginScreen.classList.toggle("hidden", logged);
  el.bankApp.classList.toggle("locked", !logged);
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.toggleAttribute("hidden", logged && !isAdmin());
  });
  if (logged && !isAdmin() && document.querySelector(".app-view.active[data-admin-only]")) {
    setActiveView("dashboard");
  }
}

function login(user, password) {
  const normalizedUser = String(user || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();
  if (!USERS[normalizedUser] || USERS[normalizedUser].password !== normalizedPassword) return false;
  sessionStorage.setItem(SESSION_KEY, normalizedUser);
  return true;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  el.loginPassword.value = "";
  setLoggedView();
}

function saveBackup() {
  localStorage.setItem(BACKUP_KEY, JSON.stringify({ savedAt: new Date().toISOString(), state }));
}

function loadBackup() {
  const saved = localStorage.getItem(BACKUP_KEY);
  if (!saved) return null;
  try {
    const backup = JSON.parse(saved);
    return backup && backup.state ? backup.state : null;
  } catch {
    return null;
  }
}

function loadDeletedSales() {
  try {
    const deleted = JSON.parse(localStorage.getItem(DELETED_SALES_KEY) || "[]");
    return Array.isArray(deleted) ? deleted : [];
  } catch {
    return [];
  }
}

function saveDeletedSale(sale) {
  const deleted = loadDeletedSales().filter((item) => item.id !== sale.id);
  deleted.unshift({ ...sale, deletedAt: new Date().toISOString() });
  localStorage.setItem(DELETED_SALES_KEY, JSON.stringify(deleted));
}

function pct(value) {
  return Number(value || 0) / 100;
}

function currency(value) {
  return BRL.format(Number(value || 0));
}

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function dateWithWeekday(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Data nao informada";
  const parsed = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAY.format(parsed)}, ${DATE.format(parsed)}`;
}

function dateToISO(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function workWeekForDate(isoDate = todayISO()) {
  const today = new Date(`${isoDate}T12:00:00`);
  const weekday = today.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);

  const labels = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta"];
  return labels.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { label, date: dateToISO(date) };
  });
}

function currentWorkWeek() {
  return workWeekForDate(todayISO());
}

function parseCurrency(value) {
  const raw = String(value || "")
    .replace("R$", "")
    .replace(/\s/g, "")
    .trim();
  if (!raw) return 0;
  if (raw.includes(",")) {
    const [integerPart, decimalPart = ""] = raw.split(",");
    const integer = integerPart.replace(/\D/g, "") || "0";
    const decimal = decimalPart.replace(/\D/g, "").slice(0, 2).padEnd(2, "0");
    return Number(`${integer}.${decimal}`);
  }
  const normalized = raw.replace(/\./g, "").replace(/[^\d.-]/g, "");
  return Number(normalized || 0);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeRate(value) {
  return Math.min(100, Math.max(0, Number(value || 0)));
}

function formatCurrencyInput(input) {
  input.value = currency(parseCurrency(input.value));
}

function setCurrencyInput(input, value) {
  input.value = currency(value);
}

function normalizeSector(sector) {
  const text = String(sector || "1 Linha");
  if (text.includes("3")) return "3 Linha";
  if (text.includes("2")) return "2 Linha";
  return "1 Linha";
}

function sellerLabel(value) {
  const text = String(value || "");
  if (text.includes("3")) return "Vendedor 3";
  if (text.includes("2")) return "Vendedor 2";
  return "Vendedor 1";
}

function activeAgents() {
  return state.agents.filter((agent) => agent.active);
}

function findAgent(agentId) {
  return state.agents.find((agent) => agent.id === agentId);
}

function getUniqueAgentIds(agentIds) {
  return [...new Set((agentIds || []).filter(Boolean))];
}

function getSelectedAgentIds() {
  return getUniqueAgentIds([el.saleAgent1.value, el.saleAgent2.value, el.saleAgent3.value]).slice(0, 3);
}

function getSaleAgentIds(sale) {
  return getUniqueAgentIds(sale.agentIds || [sale.agentId]).slice(0, 3);
}

function getSaleAgents(sale) {
  return getSaleAgentIds(sale).map(findAgent).filter(Boolean);
}

function agentNameKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ensureAgentSectors(names, sectors) {
  let changed = false;
  names.forEach((name) => {
    sectors.forEach((sector) => {
      const exists = state.agents.some(
        (agent) =>
          agent.active &&
          agentNameKey(agent.name) === agentNameKey(name) &&
          normalizeSector(agent.sector) === sector,
      );
      if (!exists) {
        state.agents.push({
          id: nextAgentId(),
          name,
          sector,
          active: true,
        });
        changed = true;
      }
    });
  });
  if (changed) saveState();
}

function getSaleFormat(sale) {
  return SALE_FORMATS[sale.format] ? sale.format : "standard";
}

function calculateSale(sale, useSnapshot = true) {
  if (useSnapshot && sale.calculationSnapshot) {
    return { ...sale.calculationSnapshot };
  }
  const settings = state.settings;
  const amount = Number(sale.amount || 0);
  const format = getSaleFormat(sale);
  const agentCount = getSaleAgentIds(sale).length;
  const hasThirdAgent = agentCount >= 3;
  const line2Rate = LINE_2_RATE;
  const machineFee = format === "machine" ? amount * 0.05 : 0;
  const amountAfterMachineFee = amount - machineFee;
  const isBank40 = format === "bank40" || format === "bank40Special";
  const bankTax =
    format === "machine"
      ? amountAfterMachineFee / 2
      : amount * pct(isBank40 ? 40 : settings.bankTaxRate);
  const firmCash =
    format === "standard"
      ? amount * pct(settings.firmCashRate)
      : format === "bank40Special"
        ? amount * pct(5)
        : 0;
  const bankTaxNet = bankTax - firmCash;
  const baseAfterTax = format === "machine" ? amountAfterMachineFee - bankTax : amount - bankTax;
  const baseLine1 = baseAfterTax;
  const sharedThreeSellerCommission = hasThirdAgent ? (baseLine1 * pct(GENERAL_LINE_RATE)) / 3 : 0;
  const line1Commission = hasThirdAgent
    ? sharedThreeSellerCommission
    : baseLine1 * pct(LINE_1_RATE);
  const baseLine2 = hasThirdAgent ? baseLine1 - line1Commission : baseLine1;
  const line2Commission = hasThirdAgent
    ? sharedThreeSellerCommission
    : baseLine1 * pct(line2Rate);
  const baseLine3 = baseLine1 - line1Commission - line2Commission;
  const line3Commission = hasThirdAgent ? sharedThreeSellerCommission : 0;
  const firm = baseLine3 - line3Commission;
  const totalFirm = firm + firmCash;
  const totalLines = line1Commission + line2Commission + line3Commission;
  return {
    snapshotVersion: 5,
    amount,
    format,
    formatLabel: SALE_FORMATS[format],
    machineFee,
    amountAfterMachineFee,
    bankTax,
    firmCash,
    bankTaxNet,
    baseAfterTax,
    barbudoFee: 0,
    barbudoRate: 0,
    baseLine1,
    line1Commission,
    baseLine2,
    line2Commission,
    baseLine3,
    line3Commission,
    firmBeforeBarbudo: firm,
    totalLines,
    firm,
    totalFirm,
    hasThirdAgent,
    line2Rate,
    bankTaxRate: isBank40 ? 40 : settings.bankTaxRate,
    line1Rate: LINE_1_RATE,
    line3Rate: settings.line3Rate,
    lineGeneralRate: GENERAL_LINE_RATE,
    threeSellerRate: GENERAL_LINE_RATE,
  };
}

function summarize() {
  const paidSales = state.sales.filter((sale) => sale.status === "Pago");
  const salesTotals = paidSales.reduce(
    (acc, sale) => {
      const calc = calculateSale(sale);
      const agentIds = getSaleAgentIds(sale);
      const commissions = [calc.line1Commission, calc.line2Commission, calc.line3Commission];
      acc.totalSold += calc.amount;
      acc.totalTax += calc.bankTax;
      acc.netCompany += calc.totalFirm;
      acc.firmCash += calc.firmCash;
      agentIds.forEach((agentId, index) => {
        if (!sale.commissionPaidAgentIds?.includes(agentId)) {
          acc.payableCommission += commissions[index] || 0;
        }
      });
      return acc;
    },
    { totalSold: 0, totalTax: 0, firmCash: 0, netCompany: 0, payableCommission: 0 },
  );
  const expenseSummary = summarizeExpenses();
  const cashCapitalTransfers = (state.firmAllocations || [])
    .filter((allocation) => allocation.type === "cash_working_capital")
    .reduce((sum, allocation) => sum + Math.max(0, Number(allocation.amount || 0)), 0);
  return {
    ...salesTotals,
    totalExpenses: expenseSummary.pending,
    pendingExpenses: expenseSummary.pending,
    paidExpenses: expenseSummary.paid,
    paidCashExpenses: expenseSummary.paidCash,
    paidWorkingCapitalExpenses: expenseSummary.paidWorkingCapital,
    cashCapitalTransfers,
    cashBalance: Math.max(0, salesTotals.firmCash - expenseSummary.paidCash - cashCapitalTransfers),
  };
}

function summarizeExpenses(expenses = state.expenses) {
  return expenses.reduce(
    (totals, expense) => {
      const amount = Math.max(0, Number(expense.amount || 0));
      if (expense.status === "Pago" && expense.paidDate) {
        totals.paid += amount;
        totals.paidCount += 1;
        if (expense.paidFrom === "working_capital") totals.paidWorkingCapital += amount;
        else totals.paidCash += amount;
      } else {
        totals.pending += amount;
        totals.pendingCount += 1;
      }
      totals.total += amount;
      return totals;
    },
    { paid: 0, paidCash: 0, paidWorkingCapital: 0, pending: 0, total: 0, paidCount: 0, pendingCount: 0 },
  );
}

function getFirmAllocationSummary() {
  const paidSales = state.sales.filter((sale) => sale.status === "Pago");
  const firmRemainder = paidSales.reduce((sum, sale) => sum + calculateSale(sale).firm, 0);
  const allocations = state.firmAllocations || [];
  const sumType = (type) =>
    allocations
      .filter((item) => item.type === type)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const prolaboreMM = sumType("prolabore_mm");
  const prolaboreFort = sumType("prolabore_fort");
  const firmCapitalTransfers = sumType("working_capital");
  const cashCapitalTransfers = sumType("cash_working_capital");
  const capitalTransfers = firmCapitalTransfers + cashCapitalTransfers;
  const allocatedTotal = prolaboreMM + prolaboreFort + firmCapitalTransfers;
  return {
    firmRemainder,
    prolaboreMM,
    prolaboreFort,
    capitalTransfers,
    cashCapitalTransfers,
    allocatedTotal,
    available: Math.max(0, firmRemainder - allocatedTotal),
    workingCapital: Number(state.workingCapitalBalance || 0),
  };
}

function transferCashBalanceToWorkingCapital(amount, note = "Sobra do caixa apos pagamento de despesas") {
  const available = summarize().cashBalance;
  const transferAmount = Math.min(Math.max(0, Number(amount || 0)), available);
  if (transferAmount <= 0) return false;
  state.firmAllocations.unshift({
    id: crypto.randomUUID(),
    type: "cash_working_capital",
    amount: transferAmount,
    date: todayISO(),
    notes: note,
    createdBy: currentSession(),
    createdAt: new Date().toISOString(),
  });
  state.workingCapitalBalance = Number(state.workingCapitalBalance || 0) + transferAmount;
  return true;
}

function getArchivePeriod(sales = [], expenses = [], allocations = []) {
  const dates = [...sales, ...expenses, ...allocations]
    .map((item) => item.date)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  if (!dates.length) return "Sem data";
  const first = DATE.format(new Date(`${dates[0]}T00:00:00`));
  const last = DATE.format(new Date(`${dates[dates.length - 1]}T00:00:00`));
  return first === last ? first : `${first} a ${last}`;
}

function archiveCurrentWeekAsLastWeek() {
  if (!HAS_SAVED_STATE) return false;
  state.weekArchives = Array.isArray(state.weekArchives) ? state.weekArchives : [];
  if (state.weekArchives.some((archive) => archive.id === LAST_WEEK_ARCHIVE_ID)) return false;
  const hasRecords =
    state.sales.length || state.expenses.length || (Array.isArray(state.firmAllocations) && state.firmAllocations.length);
  if (!hasRecords) return false;

  const archivedSales = structuredClone(state.sales);
  const archivedExpenses = structuredClone(state.expenses);
  const archivedAllocations = structuredClone(state.firmAllocations || []);
  state.weekArchives.unshift({
    id: LAST_WEEK_ARCHIVE_ID,
    label: "Semana passada",
    period: getArchivePeriod(archivedSales, archivedExpenses, archivedAllocations),
    closedAt: new Date().toISOString(),
    workingCapitalBalance: Number(state.workingCapitalBalance || 0),
    sales: archivedSales,
    expenses: archivedExpenses,
    firmAllocations: archivedAllocations,
  });

  state.sales = [];
  state.expenses = [];
  state.firmAllocations = [];
  state.weeklyClosedAt = new Date().toISOString();
  localStorage.removeItem(DELETED_SALES_KEY);
  return true;
}

function applyDataMigrations() {
  let changed = false;
  const currentVersion = Number(state.dataVersion || 0);

  if (currentVersion < 7 && HAS_SAVED_STATE) {
    state.workingCapitalBalance = Number(state.workingCapitalBalance || 0) + WORKING_CAPITAL;
    changed = true;
  }

  const alreadyTransferred = (state.firmAllocations || []).some(
    (allocation) => allocation.id === CASH_TO_CAPITAL_TRANSFER_ID,
  );
  if (HAS_SAVED_STATE && !alreadyTransferred) {
    const availableCash = summarize().cashBalance;
    if (availableCash > 0) {
      state.firmAllocations.unshift({
        id: CASH_TO_CAPITAL_TRANSFER_ID,
        type: "cash_working_capital",
        amount: availableCash,
        date: todayISO(),
        notes: "Transferencia do saldo do caixa para o giro de capital",
        createdBy: currentSession(),
        createdAt: new Date().toISOString(),
      });
      state.workingCapitalBalance = Number(state.workingCapitalBalance || 0) + availableCash;
      changed = true;
    }
  }

  const extraAlreadyAdded = (state.firmAllocations || []).some(
    (allocation) => allocation.id === EXTRA_WORKING_CAPITAL_ID,
  );
  if (HAS_SAVED_STATE && !extraAlreadyAdded) {
    state.firmAllocations.unshift({
      id: EXTRA_WORKING_CAPITAL_ID,
      type: "working_capital",
      amount: EXTRA_WORKING_CAPITAL_AMOUNT,
      date: todayISO(),
      notes: "Acrescimo manual ao giro de capital",
      createdBy: currentSession(),
      createdAt: new Date().toISOString(),
    });
    state.workingCapitalBalance = Number(state.workingCapitalBalance || 0) + EXTRA_WORKING_CAPITAL_AMOUNT;
    changed = true;
  }

  if (currentVersion < 10 && archiveCurrentWeekAsLastWeek()) {
    changed = true;
  }

  if (state.dataVersion !== DATA_VERSION) {
    state.dataVersion = DATA_VERSION;
    changed = true;
  }

  if (changed) saveState();
}

function renderSettings() {
  for (const key of Object.keys(state.settings)) {
    el[key].value = state.settings[key];
  }
}

function fillAgentSelect(select, { optional = false, keepValue = "", sector = "" } = {}) {
  select.innerHTML = "";
  if (optional) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Sem agente";
    select.append(empty);
  }
  const allowedSectors = Array.isArray(sector) ? sector : [sector].filter(Boolean);
  const agents = allowedSectors.length
    ? activeAgents().filter((agent) => allowedSectors.includes(agent.sector))
    : activeAgents();
  for (const agent of agents) {
    const option = document.createElement("option");
    option.value = agent.id;
    option.textContent = allowedSectors.length === 1 ? agent.name : `${agent.name} - ${sellerLabel(agent.sector)}`;
    select.append(option);
  }
  if ([...select.options].some((option) => option.value === keepValue)) {
    select.value = keepValue;
  }
}

function renderAgentSelect() {
  const previous = [el.saleAgent1.value, el.saleAgent2.value, el.saleAgent3.value];
  fillAgentSelect(el.saleAgent1, { keepValue: previous[0], sector: "1 Linha" });
  fillAgentSelect(el.saleAgent2, { keepValue: previous[1], sector: "2 Linha" });
  fillAgentSelect(el.saleAgent3, {
    optional: true,
    keepValue: previous[2],
    sector: ["2 Linha", "3 Linha"],
  });

  const line1Agents = activeAgents().filter((agent) => agent.sector === "1 Linha");
  const line2Agents = activeAgents().filter((agent) => agent.sector === "2 Linha");
  if (!el.saleAgent1.value && line1Agents[0]) el.saleAgent1.value = line1Agents[0].id;
  if (!el.saleAgent2.value && line2Agents[0]) el.saleAgent2.value = line2Agents[0].id;
}

function renderAgents() {
  el.agentsList.innerHTML = "";
  const agents = activeAgents();
  el.agentCount.textContent = `${agents.length} ativos`;
  for (const agent of agents) {
    const row = document.querySelector("#agentRowTemplate").content.firstElementChild.cloneNode(true);
    row.querySelector("strong").textContent = agent.name;
    row.querySelector(".agent-identity span:last-child").textContent = sellerLabel(agent.sector);
    row.querySelector(".agent-avatar").textContent = agent.name.trim().charAt(0).toUpperCase() || "A";

    const editButton = row.querySelector(".agent-edit-button");
    const deleteButton = row.querySelector(".agent-delete-button");
    editButton.addEventListener("click", () => {
      if (!isAdmin()) return;
      el.agentEditId.value = agent.id;
      el.agentEditName.value = agent.name;
      el.agentEditSector.value = agent.sector;
      el.agentEditDialog.showModal();
      el.agentEditName.focus();
    });
    deleteButton.addEventListener("click", () => {
      if (!isAdmin()) return;
      if (!confirm(`Tem certeza que deseja excluir o agente ${agent.name}?`)) return;
      agent.active = false;
      saveState();
      render();
    });
    row.querySelector(".agent-actions").classList.toggle("hidden", !isAdmin());
    el.agentsList.append(row);
  }
}

function renderSummary() {
  const totals = summarize();
  el.totalSold.textContent = currency(totals.totalSold);
  el.netCompany.textContent = currency(totals.netCompany);
  el.firmCash.textContent = currency(totals.firmCash);
  el.totalExpenses.textContent = currency(totals.pendingExpenses);
  el.cashBalance.textContent = currency(totals.cashBalance);
  el.workingCapital.textContent = currency(state.workingCapitalBalance ?? WORKING_CAPITAL);
  el.menuCashBalance.textContent = currency(totals.cashBalance);
  el.payableCommission.textContent = currency(totals.payableCommission);
  el.totalTax.textContent = currency(totals.totalTax);
}

function renderWeeklyReport() {
  const week = currentWorkWeek();
  const weekDates = new Set(week.map((day) => day.date));
  const sales = state.sales.filter((sale) => sale.status === "Pago" && weekDates.has(sale.date));
  const paidExpenses = state.expenses.filter(
    (expense) => expense.status === "Pago" && expense.paidDate && weekDates.has(expense.paidDate),
  );
  const pendingExpenses = state.expenses.filter(
    (expense) => expense.status === "Pendente" && weekDates.has(expense.date),
  );
  const salesTotal = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const expensesTotal = paidExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const pendingExpensesTotal = pendingExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const weeklyBalance = salesTotal - expensesTotal;

  el.weeklyPeriod.textContent = `${DATE.format(new Date(`${week[0].date}T00:00:00`))} a ${DATE.format(
    new Date(`${week[4].date}T00:00:00`),
  )}`;
  el.weeklySalesTotal.textContent = currency(salesTotal);
  el.weeklyExpensesTotal.textContent = currency(expensesTotal);
  el.weeklyPendingExpensesTotal.textContent = currency(pendingExpensesTotal);
  el.weeklyBalance.textContent = currency(weeklyBalance);
  el.weeklyBalance.classList.toggle("negative", weeklyBalance < 0);

  el.weeklyDailyFeed.innerHTML = week
    .map((day) => {
      const dailySales = sales
        .filter((sale) => sale.date === day.date)
        .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
      const dailyExpenses = paidExpenses
        .filter((expense) => expense.paidDate === day.date)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      const dailyPendingExpenses = pendingExpenses
        .filter((expense) => expense.date === day.date)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      const isToday = day.date === todayISO();
      return `
        <article class="weekly-day ${isToday ? "today" : ""}">
          <div class="weekly-day-name">
            <strong>${day.label}</strong>
            <span>${DATE.format(new Date(`${day.date}T00:00:00`))}${isToday ? " - Hoje" : ""}</span>
          </div>
          <div>
            <span>Vendas</span>
            <strong class="weekly-sale-value">${currency(dailySales)}</strong>
          </div>
          <div>
            <span>Despesas pagas</span>
            <strong class="weekly-expense-value">${currency(dailyExpenses)}</strong>
          </div>
          <div>
            <span>A pagar</span>
            <strong class="weekly-pending-value">${currency(dailyPendingExpenses)}</strong>
          </div>
        </article>
      `;
    })
    .join("");
}

function setActiveView(viewName) {
  document.querySelectorAll(".app-view").forEach((view) => {
    view.classList.toggle("active", view.dataset.view === viewName);
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === viewName);
  });
  el.viewTitle.textContent = viewTitles[viewName] || "Dashboard";
}

function renderExpenses() {
  const expenses = [...state.expenses].sort((a, b) => {
    if (a.status !== b.status) return a.status === "Pendente" ? -1 : 1;
    return String(b.date || "").localeCompare(String(a.date || ""));
  });
  const expenseSummary = summarizeExpenses();
  const financialSummary = summarize();
  el.expenseCount.textContent = `${expenseSummary.pendingCount} a pagar - ${expenseSummary.paidCount} pagas`;
  el.expensePendingTotal.textContent = currency(expenseSummary.pending);
  el.expensePaidTotal.textContent = currency(expenseSummary.paid);
  el.expenseCashAvailable.textContent = currency(financialSummary.cashBalance);
  el.transferCashToCapitalBtn.disabled = financialSummary.cashBalance <= 0;
  el.transferCashToCapitalBtn.textContent =
    financialSummary.cashBalance > 0
      ? `Enviar ${currency(financialSummary.cashBalance)} ao giro`
      : "Sem sobra para transferir";
  el.expensesTable.innerHTML = "";

  if (!expenses.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state firm-empty";
    empty.textContent = "Nenhuma despesa lancada.";
    el.expensesTable.append(empty);
    return;
  }

  for (const expense of expenses) {
    const isPending = expense.status === "Pendente";
    const item = document.createElement("article");
    item.className = `statement-item expense-${isPending ? "pending" : "paid"}`;
    item.innerHTML = `
      <div class="statement-date">
        <span>Lancada: ${dateWithWeekday(expense.date)}</span>
        ${
          isPending
            ? ""
            : `<small>Paga: ${dateWithWeekday(expense.paidDate)} - ${expense.paidFrom === "working_capital" ? "Giro de capital" : "Caixa"}</small>`
        }
      </div>
      <div class="statement-main">
        <span>${isPending ? "Aguardando pagamento" : expense.paidFrom === "working_capital" ? "Pago pelo giro" : "Pago pelo caixa"}</span>
        <strong>${escapeHTML(expense.description || "Despesa sem descricao")}</strong>
      </div>
      <div class="statement-amount">
        <span>${isPending ? "Valor solicitado" : expense.paidFrom === "working_capital" ? "Saida do giro" : "Saida do caixa"}</span>
        <strong>${isPending ? "" : "- "}${currency(expense.amount)}</strong>
      </div>
      ${
        isPending
          ? `<button class="secondary-button pay-expense" type="button" data-id="${expense.id}">Confirmar pagamento</button>`
          : `<span class="expense-paid-badge">Pago</span>
             ${
               isAdmin()
                 ? `<button class="secondary-button revert-expense" type="button" data-id="${expense.id}">Cancelar pagamento</button>`
                 : ""
             }`
      }
      ${
        isAdmin()
          ? `<button class="delete-sale statement-delete" type="button" data-id="${expense.id}" title="Apagar definitivamente">Apagar</button>`
          : ""
      }
    `;
    el.expensesTable.append(item);
  }

  el.expensesTable.querySelectorAll(".pay-expense").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canManagePayments()) return;
      const expense = state.expenses.find((item) => item.id === button.dataset.id);
      if (!expense || expense.status !== "Pendente") return;
      const totals = summarize();
      const amount = Number(expense.amount || 0);
      const workingCapital = Number(state.workingCapitalBalance || 0);
      let paymentSource = "cash";
      if (amount > totals.cashBalance) {
        if (amount > workingCapital) {
          alert(
            `Saldo insuficiente. Caixa: ${currency(totals.cashBalance)}. Giro de capital: ${currency(workingCapital)}.`,
          );
          return;
        }
        paymentSource = "working_capital";
      }
      const sourceLabel = paymentSource === "working_capital" ? "giro de capital" : "caixa";
      const confirmed = window.confirm(
        `O pagamento de ${currency(expense.amount)} para "${expense.description}" foi realizado? Ao confirmar, o valor sera descontado do ${sourceLabel}.`,
      );
      if (!confirmed) return;
      if (paymentSource === "working_capital") {
        state.workingCapitalBalance = Math.max(0, workingCapital - amount);
        state.firmAllocations.unshift({
          id: crypto.randomUUID(),
          type: "working_capital_expense",
          amount,
          date: todayISO(),
          notes: `Pagamento de despesa pelo giro: ${expense.description || "Despesa"}`,
          createdBy: currentSession(),
          createdAt: new Date().toISOString(),
        });
      }
      expense.status = "Pago";
      expense.paidDate = todayISO();
      expense.paidFrom = paymentSource;
      if (paymentSource === "working_capital") {
        saveState();
        render();
        return;
      }
      const remainingCash = summarize().cashBalance;
      if (
        isAdmin() &&
        remainingCash > 0 &&
        window.confirm(`Depois desta despesa sobraram ${currency(remainingCash)} no caixa. Deseja enviar toda a sobra ao giro de capital?`)
      ) {
        transferCashBalanceToWorkingCapital(
          remainingCash,
          `Sobra apos pagamento: ${expense.description || "Despesa"}`,
        );
      }
      saveState();
      render();
    });
  });

  el.expensesTable.querySelectorAll(".revert-expense").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isAdmin()) return;
      const expense = state.expenses.find((item) => item.id === button.dataset.id);
      if (!expense || expense.status !== "Pago") return;
      const paidFromWorkingCapital = expense.paidFrom === "working_capital";
      const confirmed = window.confirm(
        `Deseja cancelar o pagamento de ${currency(expense.amount)} para "${expense.description}"? O valor retornara ao ${paidFromWorkingCapital ? "giro de capital" : "caixa"}.`,
      );
      if (!confirmed) return;
      if (paidFromWorkingCapital) {
        state.workingCapitalBalance = Number(state.workingCapitalBalance || 0) + Number(expense.amount || 0);
      }
      expense.status = "Pendente";
      delete expense.paidDate;
      delete expense.paidFrom;
      saveState();
      render();
    });
  });

  el.expensesTable.querySelectorAll(".delete-sale").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isAdmin()) return;
      const expense = state.expenses.find((item) => item.id === button.dataset.id);
      if (!expense) return;
      const confirmed = window.confirm(
        expense.status === "Pago"
          ? `Deseja apagar a despesa paga "${expense.description}" de ${currency(expense.amount)}? O valor retornara ao saldo do caixa.`
          : `Deseja apagar definitivamente a despesa pendente "${expense.description}" de ${currency(expense.amount)}?`,
      );
      if (!confirmed) return;
      state.expenses = state.expenses.filter((expense) => expense.id !== button.dataset.id);
      saveState();
      render();
    });
  });
}

function getLinePaymentSummary() {
  const summary = new Map();
  const totals = { line1: 0, line2: 0, line3: 0, total: 0 };

  for (const sale of state.sales) {
    if (sale.status !== "Pago") continue;
    const calc = calculateSale(sale);
    const agentIds = getSaleAgentIds(sale);
    const commissions = [calc.line1Commission, calc.line2Commission, calc.line3Commission];

    agentIds.forEach((agentId, index) => {
      const agent = findAgent(agentId);
      const groupKey = agent ? agentNameKey(agent.name) : agentId;
      const current = summary.get(groupKey) || {
        groupKey,
        agentId,
        agentIds: [],
        name: agent ? agent.name : agentId,
        sectors: new Set(),
        sales: 0,
        line1: 0,
        line2: 0,
        line3: 0,
        total: 0,
        pendingTotal: 0,
        paidTotal: 0,
        history: [],
      };
      const value = commissions[index] || 0;
      if (!current.agentIds.includes(agentId)) current.agentIds.push(agentId);
      if (agent) current.sectors.add(agent.sector);
      current.sales += 1;
      if (index === 0) current.line1 += value;
      if (index === 1) current.line2 += value;
      if (index === 2) current.line3 += value;
      current.total += value;
      const commissionPaid = sale.commissionPaidAgentIds?.includes(agentId);
      if (commissionPaid) current.paidTotal += value;
      else current.pendingTotal += value;
      current.history.push({
        saleId: sale.id,
        date: sale.date,
        amount: calc.amount,
        format: calc.formatLabel,
        agentId,
        lineLabel: sellerLabel(`${index + 1} Linha`),
        commission: value,
        paid: Boolean(commissionPaid),
      });
      summary.set(groupKey, current);
    });

    totals.line1 += calc.line1Commission;
    totals.line2 += calc.line2Commission;
    totals.line3 += calc.line3Commission;
    totals.total += calc.totalLines;
  }

  return {
    rows: [...summary.values()].map((row) => ({
      ...row,
      sectors: [...row.sectors].map(sellerLabel).join(", "),
    })),
    totals,
  };
}

function drawRoundedRect(context, x, y, width, height, radius, fill, stroke = null) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = 2;
    context.stroke();
  }
}

function nextMotivationalMessage() {
  const available = MOTIVATIONAL_MESSAGES.filter((message) => message !== lastMotivationalMessage);
  const message = available[Math.floor(Math.random() * available.length)];
  lastMotivationalMessage = message;
  return message;
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  lines.forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
  return lines.length;
}

async function generateAgentReceipt(row) {
  const scale = 2;
  const width = 720;
  const itemHeight = 128;
  const height = 560 + row.history.length * itemHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  const gold = "#e0b34f";
  const goldLight = "#f4d98f";
  const cream = "#fff7df";
  const muted = "#cdbf9c";
  const panel = "#141414";

  context.fillStyle = "#070707";
  context.fillRect(0, 0, width, height);

  context.fillStyle = gold;
  context.fillRect(0, 0, width, 10);

  context.fillStyle = cream;
  context.font = "900 28px Arial";
  context.fillText("FINANCEIRA", 36, 58);
  context.fillStyle = muted;
  context.font = "600 15px Arial";
  context.fillText("COMPROVANTE DE COMISSAO - TODOS OS TRAMPOS", 36, 84);

  drawRoundedRect(context, 32, 112, width - 64, 116, 10, gold);
  context.fillStyle = "#211703";
  context.font = "700 15px Arial";
  context.fillText("VENDEDOR", 52, 145);
  context.fillStyle = "#080808";
  context.font = "900 38px Arial";
  context.fillText(String(row.name).toUpperCase(), 52, 188);

  context.textAlign = "right";
  context.fillStyle = "#211703";
  context.font = "700 15px Arial";
  context.fillText("TOTAL DE COMISSAO", width - 52, 145);
  context.fillStyle = "#080808";
  context.font = "900 30px Arial";
  context.fillText(currency(row.total), width - 52, 188);
  context.textAlign = "left";

  context.fillStyle = cream;
  context.font = "800 18px Arial";
  context.fillText("DETALHAMENTO DAS VENDAS", 36, 272);

  let y = 294;
  row.history.forEach((item, index) => {
    drawRoundedRect(context, 32, y, width - 64, 108, 8, panel, "rgba(224,179,79,0.45)");
    context.fillStyle = goldLight;
    context.font = "800 16px Arial";
    context.fillText(`VENDA ${index + 1}`, 50, y + 28);
    context.fillStyle = muted;
    context.font = "600 13px Arial";
    context.fillText(dateWithWeekday(item.date), 50, y + 51);

    context.fillStyle = cream;
    context.font = "800 20px Arial";
    context.fillText(currency(item.amount), 50, y + 82);

    context.textAlign = "center";
    context.fillStyle = muted;
    context.font = "700 13px Arial";
    context.fillText("FORMATO", width / 2, y + 35);
    context.fillStyle = cream;
    context.font = "800 17px Arial";
    context.fillText(item.format, width / 2, y + 65);
    context.fillStyle = goldLight;
    context.font = "800 14px Arial";
    context.fillText(item.lineLabel, width / 2, y + 88);

    context.textAlign = "right";
    context.fillStyle = muted;
    context.font = "700 13px Arial";
    context.fillText("COMISSAO", width - 50, y + 35);
    context.fillStyle = goldLight;
    context.font = "900 24px Arial";
    context.fillText(currency(item.commission), width - 50, y + 73);
    context.textAlign = "left";
    y += itemHeight;
  });

  drawRoundedRect(context, 32, y + 8, width - 64, 84, 8, "#211b0e", gold);
  context.fillStyle = muted;
  context.font = "700 14px Arial";
  context.fillText(`${row.sales} VENDA(S) PAGA(S)`, 52, y + 40);
  context.fillStyle = goldLight;
  context.font = "900 29px Arial";
  context.textAlign = "right";
  context.fillText(currency(row.total), width - 52, y + 58);
  context.textAlign = "left";

  const message = nextMotivationalMessage();
  drawRoundedRect(context, 32, y + 112, width - 64, 94, 8, "#17130b", "rgba(224,179,79,0.6)");
  context.fillStyle = gold;
  context.font = "800 13px Arial";
  context.fillText("MENSAGEM DO DIA", 52, y + 140);
  context.fillStyle = cream;
  context.font = "700 17px Arial";
  drawWrappedText(context, message, 52, y + 169, width - 104, 23);

  context.fillStyle = muted;
  context.font = "600 12px Arial";
  context.fillText(`Emitido em ${dateWithWeekday(todayISO())}`, 36, height - 24);

  const safeName = String(row.name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  if (!blob) {
    alert("Nao foi possivel gerar o comprovante. Tente novamente.");
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `comprovante-comissao-${safeName || "vendedor"}.png`;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  alert(`Comprovante de ${row.name} gerado. Verifique a pasta Downloads.`);
}

function percentageOf(value, total) {
  if (!total) return "0,00%";
  return `${((Number(value || 0) / total) * 100).toFixed(2).replace(".", ",")}%`;
}

function getFirmReceiptData() {
  const sales = state.sales.filter((sale) => sale.status === "Pago");
  const expenses = state.expenses;
  const distribution = sales.reduce(
    (totals, sale) => {
      const calc = calculateSale(sale);
      totals.entry += calc.amount;
      totals.machineFee += calc.machineFee;
      totals.bankTaxNet += calc.bankTaxNet;
      totals.cashGenerated += calc.firmCash;
      totals.payroll += calc.totalLines;
      totals.firmRemainder += calc.firm;
      return totals;
    },
    { entry: 0, machineFee: 0, bankTaxNet: 0, cashGenerated: 0, payroll: 0, firmRemainder: 0 },
  );
  const paidCashExpenses = expenses
    .filter((expense) => expense.status === "Pago" && expense.paidFrom !== "working_capital")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const paidWorkingCapitalExpenses = expenses
    .filter((expense) => expense.status === "Pago" && expense.paidFrom === "working_capital")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const paidExpenses = paidCashExpenses + paidWorkingCapitalExpenses;
  const pendingExpenses = expenses
    .filter((expense) => expense.status === "Pendente")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const cashBalance = distribution.cashGenerated - paidCashExpenses;
  const allocationSummary = getFirmAllocationSummary();
  const firmAfterExpenses = allocationSummary.available + cashBalance;
  const distributed =
    distribution.machineFee +
    distribution.bankTaxNet +
    distribution.cashGenerated +
    distribution.payroll +
    distribution.firmRemainder;

  const agents = new Map();
  sales.forEach((sale) => {
    const calc = calculateSale(sale);
    const commissions = [calc.line1Commission, calc.line2Commission, calc.line3Commission];
    getSaleAgentIds(sale).forEach((agentId, index) => {
      const agent = findAgent(agentId);
      const current = agents.get(agentId) || {
        name: agent?.name || agentId,
        total: 0,
        paid: 0,
        pending: 0,
      };
      const commission = commissions[index] || 0;
      current.total += commission;
      if (sale.commissionPaidAgentIds?.includes(agentId)) current.paid += commission;
      else current.pending += commission;
      agents.set(agentId, current);
    });
  });

  return {
    sales,
    expenses,
    agents: [...agents.values()].sort((a, b) => b.total - a.total),
    ...distribution,
    paidExpenses,
    paidCashExpenses,
    paidWorkingCapitalExpenses,
    pendingExpenses,
    cashBalance,
    firmAfterExpenses,
    distributed,
    difference: distribution.entry - distributed,
    ...allocationSummary,
  };
}

function buildFirmReceiptCanvas() {
  const data = getFirmReceiptData();
  const scale = 3;
  const width = 1500;
  const summaryRows = 16;
  const saleRows = Math.max(data.sales.length, 1);
  const agentRows = Math.max(data.agents.length, 1);
  const expenseRows = Math.max(data.expenses.length, 1);
  const height = 620 + summaryRows * 58 + saleRows * 82 + agentRows * 74 + expenseRows * 74;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  const paper = "#fffaf0";
  const ink = "#1b1b1b";
  const softInk = "#5f5748";
  const gold = "#d7a73f";
  const goldDark = "#7b5818";
  const border = "#e2c57a";
  const red = "#b42318";
  const green = "#1f7a3f";
  const tableFill = "#fff4d4";
  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);
  context.fillStyle = gold;
  context.fillRect(0, 0, width, 22);

  const left = 70;
  const right = width - 70;
  const pageWidth = right - left;

  function horizontalLine(y, color = border, lineWidth = 2) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(right, y);
    context.stroke();
  }

  function sectionTitle(title, y) {
    context.fillStyle = goldDark;
    context.font = "900 30px Arial";
    context.fillText(title, left, y);
    horizontalLine(y + 14);
    return y + 46;
  }

  function row(label, value, y, options = {}) {
    const fill = options.fill || (options.index % 2 === 0 ? "#fffdf7" : tableFill);
    context.fillStyle = fill;
    context.fillRect(left, y, pageWidth, 50);
    context.strokeStyle = border;
    context.lineWidth = 1;
    context.strokeRect(left, y, pageWidth, 50);
    context.fillStyle = options.negative ? red : ink;
    context.font = "800 23px Arial";
    context.textAlign = "left";
    context.fillText(label, left + 18, y + 33);
    if (options.percent) {
      context.fillStyle = softInk;
      context.font = "700 19px Arial";
      context.textAlign = "right";
      context.fillText(options.percent, right - 320, y + 33);
    }
    context.fillStyle = options.positive ? green : options.negative ? red : ink;
    context.font = "900 26px Arial";
    context.textAlign = "right";
    context.fillText(value, right - 18, y + 34);
    context.textAlign = "left";
    return y + 50;
  }

  function smallRow(columns, y, options = {}) {
    const fill = options.fill || (options.index % 2 === 0 ? "#fffdf7" : tableFill);
    context.fillStyle = fill;
    context.fillRect(left, y, pageWidth, 64);
    context.strokeStyle = border;
    context.lineWidth = 1;
    context.strokeRect(left, y, pageWidth, 64);
    context.fillStyle = ink;
    context.font = "800 21px Arial";
    context.textAlign = "left";
    context.fillText(columns[0], left + 18, y + 27);
    context.fillStyle = softInk;
    context.font = "700 18px Arial";
    context.fillText(columns[1], left + 18, y + 52);
    context.fillStyle = ink;
    context.font = "900 25px Arial";
    context.textAlign = "right";
    context.fillText(columns[2], right - 18, y + 40);
    context.textAlign = "left";
    return y + 64;
  }

  context.fillStyle = ink;
  context.font = "900 54px Arial";
  context.fillText("FINANCEIRA", left, 92);
  context.fillStyle = softInk;
  context.font = "700 24px Arial";
  context.fillText("COMPROVANTE FINANCEIRO DA FIRMA", left, 130);
  context.textAlign = "right";
  context.fillStyle = ink;
  context.font = "800 24px Arial";
  context.fillText(`EMITIDO EM ${dateWithWeekday(todayISO()).toUpperCase()}`, right, 82);
  context.fillStyle = softInk;
  context.font = "600 20px Arial";
  context.fillText(`RESPONSAVEL: ${(USERS[currentSession()]?.label || currentSession() || "SISTEMA").toUpperCase()}`, right, 116);
  context.textAlign = "left";

  drawRoundedRect(context, left, 166, pageWidth, 138, 8, gold);
  context.fillStyle = ink;
  context.font = "800 23px Arial";
  context.fillText("VALOR TOTAL DE ENTRADA", left + 26, 210);
  context.font = "900 58px Arial";
  context.fillText(currency(data.entry), left + 26, 274);
  context.textAlign = "right";
  context.fillStyle = ink;
  context.font = "800 22px Arial";
  context.fillText(`${data.sales.length} VENDA(S) PAGA(S)`, right - 26, 210);
  context.font = "800 20px Arial";
  context.fillText("DIFERENCA DE CONFERENCIA", right - 26, 248);
  context.font = "900 32px Arial";
  context.fillText(currency(data.difference), right - 26, 286);
  context.textAlign = "left";

  let y = 370;
  y = sectionTitle("DISTRIBUICAO DO DINHEIRO", y);

  const summary = [
    ["Taxa NFC", data.machineFee],
    ["Imposto bancario real", data.bankTaxNet],
    ["Caixa da firma", data.cashGenerated],
    ["Folha dos vendedores", data.payroll],
    ["Sobra da firma", data.firmRemainder],
    ["Despesas pagas pelo caixa", data.paidCashExpenses],
    ["Despesas pagas pelo giro", data.paidWorkingCapitalExpenses],
    ["Despesas pendentes", data.pendingExpenses],
    ["Pro-labore MM", data.prolaboreMM],
    ["Pro-labore FORT", data.prolaboreFort],
    ["Enviado ao giro de capital", data.capitalTransfers],
    ["Saldo acumulado do giro", data.workingCapital],
    ["Saldo atual do caixa", data.cashBalance],
    ["Sobra da firma disponivel", data.available],
    ["Saldo total apos destinacoes", data.firmAfterExpenses],
    ["Total distribuido das vendas", data.distributed],
  ];
  summary.forEach(([label, value], index) => {
    const isExpense = label.includes("Despesa");
    const isGood = label.includes("giro") || label.includes("Saldo acumulado");
    y = row(label, currency(value), y, {
      index,
      percent: `${percentageOf(value, data.entry)} do total`,
      negative: isExpense,
      positive: isGood,
    });
  });
  y += 36;

  y = sectionTitle("VENDAS E DESTINOS", y);
  if (!data.sales.length) {
    y = row("Nenhuma venda paga registrada.", "", y, { index: 0 });
  } else {
    data.sales.forEach((sale, index) => {
      const calc = calculateSale(sale);
      y = smallRow(
        [
          `${index + 1}. ${calc.formatLabel} - ${dateWithWeekday(sale.date)}`,
          `Imposto ${currency(calc.bankTaxNet)} | Folha ${currency(calc.totalLines)} | Firma ${currency(calc.firm)} | Taxa NFC ${currency(calc.machineFee)}`,
          currency(calc.amount),
        ],
        y,
        { index },
      );
    });
  }

  y += 36;
  y = sectionTitle("FOLHA POR VENDEDOR", y);
  if (!data.agents.length) {
    y = row("Nenhuma comissao registrada.", "", y, { index: 0 });
  } else {
    data.agents.forEach((agent, index) => {
      y = smallRow(
        [
          String(agent.name).toUpperCase(),
          `Pago ${currency(agent.paid)} | A pagar ${currency(agent.pending)} | ${percentageOf(agent.total, data.entry)} do total`,
          currency(agent.total),
        ],
        y,
        { index },
      );
    });
  }

  y += 36;
  y = sectionTitle("DESPESAS", y);
  if (!data.expenses.length) {
    y = row("Nenhuma despesa registrada.", "", y, { index: 0 });
  } else {
    data.expenses.forEach((expense, index) => {
      const expenseDescription = String(expense.description || "Despesa sem descricao");
      const source = expense.status === "Pago" && expense.paidFrom === "working_capital" ? " - Giro" : "";
      y = smallRow(
        [
          expenseDescription.length > 86 ? `${expenseDescription.slice(0, 83)}...` : expenseDescription,
          `${dateWithWeekday(expense.date)} - ${expense.status}${source}`,
          currency(expense.amount),
        ],
        y,
        { index },
      );
    });
  }

  context.fillStyle = softInk;
  context.font = "600 20px Arial";
  context.fillText("Documento gerado pelo sistema FINANCEIRA para conferencia interna.", left, height - 42);
  return canvas;
}

function downloadFirmReceipt() {
  const canvas = buildFirmReceiptCanvas();
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `comprovante-firma-${todayISO()}.png`;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  alert("Comprovante da firma gerado. Verifique a pasta Downloads.");
}

function printFirmReceipt() {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("O navegador bloqueou a impressao. Permita pop-ups e tente novamente.");
    return;
  }
  const image = buildFirmReceiptCanvas().toDataURL("image/png");
  printWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <title>Comprovante da firma</title>
        <style>
          @page { margin: 8mm; }
          body { margin: 0; background: #fff; text-align: center; }
          img { width: 100%; max-width: 1500px; height: auto; }
        </style>
      </head>
      <body><img src="${image}" alt="Comprovante financeiro da firma" onload="window.print()" /></body>
    </html>
  `);
  printWindow.document.close();
}

function getBarbudoClosingData() {
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(el.barbudoClosingDate.value)
    ? el.barbudoClosingDate.value
    : todayISO();
  const week = workWeekForDate(selectedDate);
  const weekDates = new Set(week.map((day) => day.date));
  const sales = state.sales.filter((sale) => sale.status === "Pago" && weekDates.has(sale.date));
  const dailySales = sales.filter((sale) => sale.date === selectedDate);
  const days = week.map((day) => {
    const rows = sales.filter((sale) => sale.date === day.date);
    return {
      ...day,
      sales: rows,
      total: rows.reduce((sum, sale) => sum + calculateSale(sale).barbudoFee, 0),
    };
  });
  return {
    selectedDate,
    week,
    days,
    dailySales,
    dailyTotal: dailySales.reduce((sum, sale) => sum + calculateSale(sale).barbudoFee, 0),
    weeklyTotal: days.reduce((sum, day) => sum + day.total, 0),
    dailySalesVolume: dailySales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0),
    weeklySalesVolume: sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0),
  };
}

function renderBarbudoClosing() {
  const data = getBarbudoClosingData();
  el.barbudoDailyTotal.textContent = currency(data.dailyTotal);
  el.barbudoDailyCount.textContent = `${data.dailySales.length} venda(s) paga(s)`;
  el.barbudoDailySalesVolume.textContent = currency(data.dailySalesVolume);
  el.barbudoWeeklyTotal.textContent = currency(data.weeklyTotal);
  el.barbudoWeeklySalesVolume.textContent = currency(data.weeklySalesVolume);
  el.barbudoWeeklyPeriod.textContent = `${DATE.format(new Date(`${data.week[0].date}T00:00:00Z`))} a ${DATE.format(
    new Date(`${data.week[4].date}T00:00:00Z`),
  )}`;
  el.barbudoWeeklyDays.innerHTML = data.days
    .map(
      (day) => `
        <article class="${day.date === data.selectedDate ? "selected" : ""}">
          <span>${day.label}</span>
          <strong>${currency(day.total)}</strong>
          <small>${day.sales.length} venda(s)</small>
        </article>
      `,
    )
    .join("");
  el.barbudoDailySales.innerHTML = data.dailySales.length
    ? data.dailySales
        .map((sale) => {
          const calc = calculateSale(sale);
          return `
            <article>
              <div>
                <span>${calc.formatLabel}</span>
                <strong>Venda ${currency(calc.amount)}</strong>
                <small>Socio Barbudo recebe 5%</small>
              </div>
              <strong>${currency(calc.barbudoFee)}</strong>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state firm-empty">Nenhuma Taxa Barbudo gerada nessa data.</div>`;
}

function buildBarbudoReceiptCanvas() {
  const data = getBarbudoClosingData();
  const scale = 2;
  const width = 760;
  const height = 650 + Math.max(data.dailySales.length, 1) * 72;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  const gold = "#e0b34f";
  const light = "#f5db96";
  const cream = "#fff7df";
  const muted = "#cdbf9c";
  const panel = "#151515";

  context.fillStyle = "#070707";
  context.fillRect(0, 0, width, height);
  context.fillStyle = gold;
  context.fillRect(0, 0, width, 10);
  context.fillStyle = cream;
  context.font = "900 29px Arial";
  context.fillText("FINANCEIRA", 38, 60);
  context.fillStyle = muted;
  context.font = "700 14px Arial";
  context.fillText("FECHAMENTO COMISSAO SOCIO BARBUDO", 38, 86);

  drawRoundedRect(context, 34, 112, width - 68, 112, 8, gold);
  context.fillStyle = "#211703";
  context.font = "800 14px Arial";
  context.fillText("TOTAL DO DIA", 54, 144);
  context.fillStyle = "#070707";
  context.font = "900 34px Arial";
  context.fillText(currency(data.dailyTotal), 54, 188);
  context.font = "800 13px Arial";
  context.fillText(`VENDAS DO DIA ${currency(data.dailySalesVolume)}`, 54, 210);
  context.textAlign = "right";
  context.fillStyle = "#211703";
  context.font = "800 14px Arial";
  context.fillText(dateWithWeekday(data.selectedDate).toUpperCase(), width - 54, 148);
  context.font = "900 20px Arial";
  context.fillText(`${data.dailySales.length} VENDA(S)`, width - 54, 184);
  context.textAlign = "left";

  context.fillStyle = cream;
  context.font = "900 19px Arial";
  context.fillText("RESUMO SEMANAL", 38, 266);
  context.textAlign = "right";
  context.fillStyle = light;
  context.font = "900 24px Arial";
  context.fillText(currency(data.weeklyTotal), width - 38, 266);
  context.textAlign = "left";

  let y = 286;
  data.days.forEach((day) => {
    drawRoundedRect(context, 34, y, width - 68, 48, 5, day.date === data.selectedDate ? "#2b220e" : panel, "rgba(224,179,79,0.35)");
    context.fillStyle = cream;
    context.font = "800 15px Arial";
    context.fillText(`${day.label} - ${DATE.format(new Date(`${day.date}T00:00:00Z`))}`, 52, y + 29);
    context.textAlign = "center";
    context.fillStyle = muted;
    context.font = "700 13px Arial";
    context.fillText(`${day.sales.length} venda(s)`, width - 205, y + 29);
    context.textAlign = "right";
    context.fillStyle = light;
    context.font = "900 17px Arial";
    context.fillText(currency(day.total), width - 52, y + 30);
    context.textAlign = "left";
    y += 56;
  });

  y += 18;
  context.fillStyle = cream;
  context.font = "900 19px Arial";
  context.fillText("VENDAS DO DIA", 38, y);
  y += 18;
  if (!data.dailySales.length) {
    drawRoundedRect(context, 34, y, width - 68, 58, 5, panel, "rgba(224,179,79,0.35)");
    context.fillStyle = muted;
    context.font = "700 14px Arial";
    context.fillText("Nenhuma venda paga nessa data.", 52, y + 35);
  } else {
    data.dailySales.forEach((sale) => {
      const calc = calculateSale(sale);
      drawRoundedRect(context, 34, y, width - 68, 58, 5, panel, "rgba(224,179,79,0.35)");
      context.fillStyle = cream;
      context.font = "800 15px Arial";
      context.fillText(`${calc.formatLabel} - Venda ${currency(calc.amount)} - Socio Barbudo 5%`, 52, y + 34);
      context.textAlign = "right";
      context.fillStyle = light;
      context.font = "900 18px Arial";
      context.fillText(currency(calc.barbudoFee), width - 52, y + 35);
      context.textAlign = "left";
      y += 66;
    });
  }
  context.fillStyle = muted;
  context.font = "600 12px Arial";
  context.fillText(`Emitido em ${dateWithWeekday(todayISO())} para conferencia interna.`, 38, height - 24);
  return canvas;
}

function downloadBarbudoReceipt() {
  const data = getBarbudoClosingData();
  const link = document.createElement("a");
  link.href = buildBarbudoReceiptCanvas().toDataURL("image/png");
  link.download = `fechamento-barbudo-${data.selectedDate}.png`;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
}

function printBarbudoReceipt() {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("O navegador bloqueou a impressao. Permita pop-ups e tente novamente.");
    return;
  }
  const image = buildBarbudoReceiptCanvas().toDataURL("image/png");
  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><title>Fechamento Taxa Barbudo</title><style>@page{margin:8mm}body{margin:0;text-align:center}img{width:100%;max-width:760px;height:auto}</style></head><body><img src="${image}" alt="Fechamento Taxa Barbudo" onload="window.print()"></body></html>`);
  printWindow.document.close();
}

function renderLinePayments() {
  const { rows, totals } = getLinePaymentSummary();
  el.line1Total.textContent = currency(totals.line1);
  el.line2Total.textContent = currency(totals.line2);
  el.line3Total.textContent = currency(totals.line3);
  el.linePayTotal.textContent = currency(totals.total);
  el.linePaymentCount.textContent = `${rows.length} agentes`;
  el.linePaymentsTable.innerHTML = "";

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state firm-empty";
    empty.textContent = "Nenhuma comissao de vendedor em vendas pagas.";
    el.linePaymentsTable.append(empty);
    return;
  }

  for (const row of rows) {
    const card = document.createElement("article");
    card.className = "payment-agent-card";
    const roleTotals = [
      ["Vendedor 1", row.line1],
      ["Vendedor 2", row.line2],
      ["Vendedor 3", row.line3],
    ]
      .filter(([, value]) => value > 0)
      .map(
        ([label, value]) => `
          <div class="seller-role-total">
            <span>${label}</span>
            <strong>${currency(value)}</strong>
          </div>
        `,
      )
      .join("");
    const historyItems = row.history
      .map(
        (item) => `
          <div class="payment-history-item">
            <div class="seller-payment-value">
              <span>Valor da venda</span>
              <strong>${currency(item.amount)}</strong>
            </div>
            <div class="seller-payment-format">
              <span>Formato</span>
              <strong>${item.format}</strong>
            </div>
            <div class="seller-payment-format">
              <span>Trampo</span>
              <strong>${item.lineLabel}</strong>
            </div>
            <div class="seller-payment-commission">
              <span>Comissao ${item.paid ? "paga" : "a pagar"}</span>
              <strong>${currency(item.commission)}</strong>
            </div>
          </div>
        `,
      )
      .join("");
    card.innerHTML = `
      <div class="payment-agent-top">
        <div>
          <span>Vendedor</span>
          <strong>${escapeHTML(row.name)}</strong>
          <small>${escapeHTML(row.sectors || "Todos os trampos")}</small>
        </div>
        <div class="payment-total">
          <span>Valor a pagar</span>
          <strong>${currency(row.pendingTotal)}</strong>
        </div>
      </div>
      <div class="seller-role-summary">
        ${roleTotals || `<div class="seller-role-total"><span>Comissoes</span><strong>${currency(row.total)}</strong></div>`}
      </div>
      <div class="payment-history">
        <div class="payment-history-title">
          <strong>${row.sales} trampo(s) registrado(s)</strong>
        </div>
        ${historyItems}
      </div>
      ${
        row.pendingTotal > 0 && canManagePayments()
          ? `<button class="secondary-button pay-agent-commission" type="button" data-agent-key="${row.groupKey}">
               Marcar folha como paga
             </button>`
          : `<span class="expense-paid-badge">${row.pendingTotal > 0 ? "Aguardando pagamento" : "Folha paga"}</span>`
      }
      <button class="download-receipt-button" type="button" data-agent-key="${row.groupKey}">
        Baixar comprovante em imagem
      </button>
    `;
    el.linePaymentsTable.append(card);
  }

  el.linePaymentsTable.querySelectorAll(".download-receipt-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = rows.find((item) => item.groupKey === button.dataset.agentKey);
      if (!row) return;
      button.disabled = true;
      button.textContent = "Gerando comprovante...";
      try {
        await generateAgentReceipt(row);
      } finally {
        button.disabled = false;
        button.textContent = "Baixar comprovante em imagem";
      }
    });
  });

  el.linePaymentsTable.querySelectorAll(".pay-agent-commission").forEach((button) => {
    button.addEventListener("click", () => {
      if (!canManagePayments()) return;
      const row = rows.find((item) => item.groupKey === button.dataset.agentKey);
      if (!row || row.pendingTotal <= 0) return;
      const confirmed = window.confirm(
        `Confirma o pagamento de ${currency(row.pendingTotal)} da folha de ${row.name}?`,
      );
      if (!confirmed) return;
      row.history
        .filter((item) => !item.paid)
        .forEach((item) => {
          const sale = state.sales.find((candidate) => candidate.id === item.saleId);
          if (!sale) return;
          sale.commissionPaidAgentIds = getUniqueAgentIds([
            ...(sale.commissionPaidAgentIds || []),
            item.agentId,
          ]);
        });
      saveState();
      render();
      alert(`Folha de ${row.name} marcada como paga.`);
    });
  });
}

function renderFirmCommission() {
  const totals = summarize();
  const paidSales = state.sales.filter((sale) => sale.status === "Pago");
  const allocations = getFirmAllocationSummary();
  el.firmWorkingCapital.textContent = currency(allocations.workingCapital);
  el.firmRemainderTotal.textContent = currency(allocations.available);
  el.firmProlaboreMM.textContent = currency(allocations.prolaboreMM);
  el.firmProlaboreFort.textContent = currency(allocations.prolaboreFort);
  el.firmAvailableAllocation.textContent = `Disponivel ${currency(allocations.available)}`;
  const capitalProgress = Math.min(100, (allocations.workingCapital / WORKING_CAPITAL_GOAL) * 100);
  const capitalRemaining = Math.max(0, WORKING_CAPITAL_GOAL - allocations.workingCapital);
  el.capitalGoalStatus.textContent = `${currency(allocations.workingCapital)} de ${currency(WORKING_CAPITAL_GOAL)}`;
  el.capitalGoalRemaining.textContent =
    capitalRemaining > 0
      ? `Faltam ${currency(capitalRemaining)} para a empresa ficar redonda`
      : "Meta atingida. O giro de capital esta completo.";
  el.capitalProgressBar.style.width = `${capitalProgress}%`;
  el.capitalProgressBar.classList.toggle("complete", capitalRemaining === 0);
  el.firmCashDetailTotal.textContent = currency(totals.firmCash);
  el.firmExpenseTotal.textContent = currency(totals.pendingExpenses);
  el.firmPaidExpenseTotal.textContent = currency(totals.paidExpenses);
  el.firmCashBalanceDetail.textContent = currency(totals.cashBalance);
  el.firmCommissionTotal.textContent = currency(totals.netCompany);
  el.firmSaleCount.textContent = `${paidSales.length} vendas pagas`;
  el.firmExpenseCount.textContent = `${state.expenses.length} registros`;

  const paidWorkSales = paidSales;
  const firmWorkTotal = paidWorkSales.reduce((sum, sale) => sum + calculateSale(sale).firm, 0);
  el.firmWorkCount.textContent = paidWorkSales.length;
  el.firmWorkTotal.textContent = currency(firmWorkTotal);

  el.firmCommissionCards.innerHTML = "";
  if (!paidSales.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state firm-empty";
    empty.textContent = "Nenhuma venda paga.";
    el.firmCommissionCards.append(empty);
  } else {
    for (const sale of paidSales) {
      const calc = calculateSale(sale);
      const card = document.createElement("article");
      card.className = "firm-sale-card";
      card.innerHTML = `
        <div class="firm-card-top">
          <div>
            <span>${dateWithWeekday(sale.date)}</span>
            <strong>${escapeHTML(sale.client || "Venda registrada")}</strong>
          </div>
          <span class="status ${sale.status.toLowerCase()}">${sale.status}</span>
        </div>
        <div class="firm-flow">
          <div>
            <span>Venda</span>
            <strong>${currency(calc.amount)}</strong>
          </div>
          <div>
            <span>Formato</span>
            <strong>${calc.formatLabel}</strong>
          </div>
          <div>
            <span>Taxa NFC</span>
            <strong>${currency(calc.machineFee)}</strong>
          </div>
          <div>
            <span>Imposto real</span>
            <strong>${currency(calc.bankTaxNet)}</strong>
          </div>
          <div>
            <span>Caixa empresa</span>
            <strong>${currency(calc.firmCash)}</strong>
          </div>
          <div>
            <span>Sobra firma</span>
            <strong>${currency(calc.firm)}</strong>
          </div>
        </div>
        <div class="firm-card-total">
          <span>Total da firma nessa venda</span>
          <strong>${currency(calc.totalFirm)}</strong>
        </div>
      `;
      el.firmCommissionCards.append(card);
    }
  }

  el.firmExpensesCards.innerHTML = "";
  if (!state.expenses.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state firm-empty";
    empty.textContent = "Nenhuma despesa lancada.";
    el.firmExpensesCards.append(empty);
  } else {
    for (const expense of state.expenses) {
      const card = document.createElement("article");
      const isPending = expense.status === "Pendente";
      card.className = `firm-expense-card expense-${isPending ? "pending" : "paid"}`;
      card.innerHTML = `
        <div>
          <span>${dateWithWeekday(expense.date)}</span>
          <strong>${escapeHTML(expense.description || "Despesa sem descricao")}</strong>
          <small>${isPending ? "Aguardando pagamento" : expense.paidFrom === "working_capital" ? "Pago pelo giro" : "Pago pelo caixa"}</small>
        </div>
        <strong>${isPending ? "" : "- "}${currency(expense.amount)}</strong>
      `;
      el.firmExpensesCards.append(card);
    }
  }

  el.firmWorkCards.innerHTML = "";
  if (!paidWorkSales.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state firm-empty";
    empty.textContent = "Nenhuma venda paga realizada.";
    el.firmWorkCards.append(empty);
  } else {
    for (const sale of paidWorkSales) {
      const calc = calculateSale(sale);
      const card = document.createElement("article");
      card.className = "firm-work-card";
      card.innerHTML = `
        <div>
          <span>${dateWithWeekday(sale.date)}</span>
          <strong>${calc.formatLabel}</strong>
          <small>Venda realizada: ${currency(calc.amount)}</small>
        </div>
        <strong>${currency(calc.firm)}</strong>
      `;
      el.firmWorkCards.append(card);
    }
  }

  el.firmAllocationHistory.innerHTML = "";
  if (!state.firmAllocations.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state firm-empty";
    empty.textContent = "Nenhuma destinacao da firma registrada.";
    el.firmAllocationHistory.append(empty);
  } else {
    const labels = {
      prolabore_mm: "Pro-labore MM",
      prolabore_fort: "Pro-labore FORT",
      working_capital: "Giro de capital",
      cash_working_capital: "Giro de capital - sobra do caixa",
      working_capital_expense: "Despesa paga pelo giro",
    };
    state.firmAllocations.forEach((allocation) => {
      const card = document.createElement("article");
      card.className = "allocation-item";
      card.innerHTML = `
        <div>
          <span>${dateWithWeekday(allocation.date)}</span>
          <strong>${labels[allocation.type] || "Destinacao da firma"}</strong>
          <small>${escapeHTML(allocation.notes || "Sem observacao")}</small>
        </div>
        <div>
          <strong>${currency(allocation.amount)}</strong>
          ${
            isAdmin()
              ? `<button class="delete-allocation" type="button" data-id="${allocation.id}">Cancelar</button>`
              : ""
          }
        </div>
      `;
      el.firmAllocationHistory.append(card);
    });
  }

  el.firmAllocationHistory.querySelectorAll(".delete-allocation").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isAdmin()) return;
      const allocation = state.firmAllocations.find((item) => item.id === button.dataset.id);
      if (!allocation) return;
      if (!window.confirm(`Deseja cancelar a destinacao de ${currency(allocation.amount)}?`)) return;
      if (["working_capital", "cash_working_capital"].includes(allocation.type)) {
        state.workingCapitalBalance = Math.max(
          0,
          Number(state.workingCapitalBalance || 0) - Number(allocation.amount || 0),
        );
      }
      if (allocation.type === "working_capital_expense") {
        state.workingCapitalBalance = Number(state.workingCapitalBalance || 0) + Number(allocation.amount || 0);
      }
      state.firmAllocations = state.firmAllocations.filter((item) => item.id !== allocation.id);
      saveState();
      render();
    });
  });
}

function getSelectedHistoryScope() {
  const selected = el.weekArchiveFilter?.value || "current";
  if (selected !== "current") {
    const archive = (state.weekArchives || []).find((item) => item.id === selected);
    if (archive) {
      return {
        key: archive.id,
        label: archive.label || "Semana arquivada",
        period: archive.period || "Periodo arquivado",
        archived: true,
        sales: archive.sales || [],
        expenses: archive.expenses || [],
      };
    }
  }
  return {
    key: "current",
    label: "Semana atual",
    period: "Lancamentos atuais",
    archived: false,
    sales: state.sales,
    expenses: state.expenses,
  };
}

function renderWeekArchiveFilter() {
  if (!el.weekArchiveFilter) return;
  const previous = el.weekArchiveFilter.value || "current";
  const options = [
    `<option value="current">Semana atual</option>`,
    ...(state.weekArchives || []).map((archive) => {
      const details = archive.period ? ` - ${archive.period}` : "";
      return `<option value="${escapeHTML(archive.id)}">${escapeHTML(archive.label || "Semana arquivada")}${escapeHTML(
        details,
      )}</option>`;
    }),
  ];
  el.weekArchiveFilter.innerHTML = options.join("");
  const exists = [...el.weekArchiveFilter.options].some((option) => option.value === previous);
  el.weekArchiveFilter.value = exists ? previous : "current";
}

function renderSales() {
  renderWeekArchiveFilter();
  const scope = getSelectedHistoryScope();
  const filter = el.statusFilter.value;
  const rows = scope.sales.filter((sale) => filter === "Todos" || sale.status === filter);
  const formatTotals = rows.reduce(
    (totals, sale) => {
      totals[getSaleFormat(sale)] += Number(sale.amount || 0);
      return totals;
    },
    { standard: 0, bank40: 0, bank40Special: 0, machine: 0 },
  );
  el.historyStandardTotal.textContent = currency(formatTotals.standard);
  el.historyBank40Total.textContent = currency(formatTotals.bank40);
  el.historyBank40SpecialTotal.textContent = currency(formatTotals.bank40Special);
  el.historyMachineTotal.textContent = currency(formatTotals.machine);

  const firmCashRows = rows
    .filter((sale) => sale.status === "Pago")
    .map((sale) => ({ sale, calc: calculateSale(sale) }))
    .filter(({ calc }) => calc.firmCash > 0);
  const firmCashTotal = firmCashRows.reduce((sum, item) => sum + item.calc.firmCash, 0);
  el.historyFirmCashTotal.textContent = currency(firmCashTotal);
  el.historyFirmCashList.innerHTML = firmCashRows.length
    ? firmCashRows
        .map(({ sale, calc }) => {
          const agents = getSaleAgents(sale).map((agent) => escapeHTML(agent.name)).join(" + ") || "Sem agente";
          const label = sale.loanGroupLabel || sale.notes || "Venda registrada";
          return `
            <article class="firm-cash-history-item">
              <div>
                <span>${dateWithWeekday(sale.date)}</span>
                <strong>${escapeHTML(calc.formatLabel)}</strong>
                <small>${escapeHTML(label)} - ${agents}</small>
              </div>
              <div>
                <span>Venda ${currency(calc.amount)}</span>
                <strong>${currency(calc.firmCash)}</strong>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="firm-cash-history-empty">Nenhum valor de caixa confirmado nesse filtro.</div>`;

  const proofSales = scope.sales.filter((sale) => sale.status === "Pago");
  const proof = proofSales.reduce(
    (totals, sale) => {
      const calc = calculateSale(sale);
      totals.entry += calc.amount;
      totals.tax += calc.bankTaxNet + calc.machineFee;
      totals.payroll += calc.totalLines;
      totals.cashGenerated += calc.firmCash;
      totals.firm += calc.firm;
      return totals;
    },
    { entry: 0, tax: 0, payroll: 0, cashGenerated: 0, firm: 0 },
  );
  const paidExpenses = scope.expenses
    .filter((expense) => expense.status === "Pago")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const cashBalance = proof.cashGenerated - paidExpenses;
  const distributed = proof.tax + proof.payroll + paidExpenses + cashBalance + proof.firm;
  const difference = proof.entry - distributed;
  const isBalanced = Math.abs(difference) < 0.01;

  el.proofEntry.textContent = currency(proof.entry);
  el.proofTax.textContent = currency(proof.tax);
  el.proofPayroll.textContent = currency(proof.payroll);
  el.proofExpenses.textContent = currency(paidExpenses);
  el.proofCash.textContent = currency(cashBalance);
  el.proofFirm.textContent = currency(proof.firm);
  el.proofDistributed.textContent = currency(distributed);
  el.proofDifference.textContent = currency(difference);
  el.proofStatus.textContent = isBalanced ? "Valores conferidos" : "Existe divergencia";
  el.proofStatus.classList.toggle("divergent", !isBalanced);
  el.salesCards.innerHTML = "";

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state firm-empty";
    empty.textContent = scope.archived
      ? "Nenhuma venda encontrada nessa semana arquivada."
      : "Semana atual limpa. Registre as vendas de ontem e hoje.";
    el.salesCards.append(empty);
    return;
  }

  const groupedSales = new Map();
  rows.forEach((sale) => {
    if (!sale.loanGroupId) return;
    const group = groupedSales.get(sale.loanGroupId) || [];
    group.push(sale);
    groupedSales.set(sale.loanGroupId, group);
  });

  groupedSales.forEach((sales, groupId) => {
    const sortedSales = [...sales].sort((a, b) => Number(a.loanPart || 0) - Number(b.loanPart || 0));
    const groupTotal = sortedSales.reduce((sum, sale) => sum + calculateSale(sale).amount, 0);
    const groupLines = sortedSales.reduce((sum, sale) => sum + calculateSale(sale).totalLines, 0);
    const groupFirm = sortedSales.reduce((sum, sale) => sum + calculateSale(sale).firm, 0);
    const groupCash = sortedSales.reduce((sum, sale) => sum + calculateSale(sale).firmCash, 0);
    const agentCommissionTotals = new Map();
    sortedSales.forEach((sale) => {
      const calc = calculateSale(sale);
      const commissions = [calc.line1Commission, calc.line2Commission, calc.line3Commission];
      getSaleAgentIds(sale).forEach((agentId, index) => {
        agentCommissionTotals.set(agentId, (agentCommissionTotals.get(agentId) || 0) + commissions[index]);
      });
    });
    const groupCard = document.createElement("article");
    groupCard.className = "loan-group-card";
    groupCard.dataset.groupId = groupId;
    groupCard.innerHTML = `
      <div class="loan-group-heading">
        <div>
          <span>Mesmo emprestimo</span>
          <strong>${escapeHTML(sortedSales[0].loanGroupLabel || "Emprestimo agrupado")}</strong>
        </div>
        <strong>${currency(groupTotal)}</strong>
      </div>
      <div class="loan-group-parts">
        ${sortedSales
          .map((sale, index) => {
            const calc = calculateSale(sale);
            const agents = getSaleAgents(sale).map((agent) => escapeHTML(agent.name)).join(" + ");
            return `
              <div class="loan-group-part">
                <div>
                  <span>Valor ${index + 1}</span>
                  <strong>${currency(calc.amount)}</strong>
                </div>
                <div>
                  <span>Mesmos agentes</span>
                  <strong>${agents || "-"}</strong>
                </div>
                <div>
                  <span>Sobra firma</span>
                  <strong>${currency(calc.firm)}</strong>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="loan-agent-commissions">
        ${[...agentCommissionTotals.entries()]
          .map(([agentId, commission]) => {
            const agent = findAgent(agentId);
            return `
              <div>
                <span>${escapeHTML(agent?.name || agentId)}</span>
                <strong>${currency(commission)}</strong>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="loan-group-summary">
        <div class="loan-total-commission"><span>Comissao total dos agentes</span><strong>${currency(groupLines)}</strong></div>
        <div><span>Caixa firma</span><strong>${currency(groupCash)}</strong></div>
        <div><span>Total sobra firma</span><strong>${currency(groupFirm)}</strong></div>
      </div>
    `;
    el.salesCards.append(groupCard);
  });

  for (const sale of rows) {
    if (sale.loanGroupId) continue;
    const calc = calculateSale(sale);
    const agents = getSaleAgents(sale);
    const agentNames = agents.length ? agents.map((agent) => escapeHTML(agent.name)).join(", ") : "-";
    const agentSectors = agents.length ? agents.map((agent) => escapeHTML(agent.sector)).join(", ") : "-";
    const lineRows = [];
    if (calc.machineFee > 0) {
      lineRows.push({
        label: "Taxa NFC",
        calc: `${currency(calc.amount)} - 5%`,
        percent: "5%",
        value: calc.machineFee,
      });
    }
    lineRows.push(
      {
        label: "Desconto bancario",
        calc:
          calc.format === "machine"
            ? `${currency(calc.amountAfterMachineFee)} / 2`
            : `${currency(calc.amount)} - ${calc.bankTaxRate}%`,
        percent: calc.format === "machine" ? "metade" : `${calc.bankTaxRate}%`,
        value: calc.bankTax,
      },
      {
        label: "Vendedor 1",
        calc: calc.hasThirdAgent
          ? `${currency(calc.baseLine1)} x 40% / 3`
          : `${currency(calc.baseLine1)} - ${calc.line1Rate}%`,
        percent: calc.hasThirdAgent ? "1/3 de 40%" : `${calc.line1Rate}%`,
        value: calc.line1Commission,
      },
      {
        label: "Vendedor 2",
        calc: calc.hasThirdAgent
          ? `${currency(calc.baseLine1)} x 40% / 3`
          : `${currency(calc.baseLine1)} x ${calc.line2Rate}%`,
        percent: calc.hasThirdAgent ? "1/3 de 40%" : `${calc.line2Rate}%`,
        value: calc.line2Commission,
      },
    );

    if (calc.hasThirdAgent) {
      lineRows.push({
        label: "Vendedor 3",
        calc: `${currency(calc.baseLine1)} x 40% / 3`,
        percent: "1/3 de 40%",
        value: calc.line3Commission,
      });
    }

    const card = document.createElement("article");
    card.className = "format-sale-card";
    card.innerHTML = `
      <div class="sale-modern-head">
        <div>
          <span>${dateWithWeekday(sale.date)}</span>
          <h3>${currency(calc.amount)}</h3>
          <strong>${calc.formatLabel}</strong>
        </div>
        <span class="status ${sale.status.toLowerCase()}">${sale.status}</span>
      </div>

      <div class="sale-modern-people">
        <div>
          <span>Vendedores</span>
          <strong>${agentNames}</strong>
        </div>
        <div>
          <span>Setores</span>
          <strong>${agentSectors}</strong>
        </div>
      </div>

      <div class="sale-modern-flow">
        <div>
          <span>Desconto</span>
          <strong>${currency(calc.bankTax)}</strong>
          <small>${calc.format === "machine" ? "metade apos NFC" : `${calc.bankTaxRate}% da venda`}</small>
        </div>
        <div>
          <span>Vendedores</span>
          <strong>${currency(calc.totalLines)}</strong>
          <small>${calc.hasThirdAgent ? "40% dividido em 3" : "V1 15% + V2 25%"}</small>
        </div>
        <div>
          <span>Caixa firma</span>
          <strong>${currency(calc.firmCash)}</strong>
          <small>${calc.firmCash > 0 ? "entrada separada" : "sem entrada"}</small>
        </div>
        <div class="sale-modern-firm">
          <span>Sobra firma</span>
          <strong>${currency(calc.firm)}</strong>
          <small>saldo da operacao</small>
        </div>
      </div>

      <div class="sale-modern-details">
        ${lineRows
          .map(
            (row) => `
              <div>
                <span>${row.label}</span>
                <strong>${currency(row.value)}</strong>
                <small>${row.percent}</small>
              </div>
            `,
          )
          .join("")}
        <div>
          <span>Firma</span>
          <strong>${currency(calc.firm)}</strong>
          <small>Sobra</small>
        </div>
      </div>

      <div class="history-card-actions">
        ${
          !scope.archived && isAdmin() && sale.status === "Pendente"
            ? `<button class="secondary-button change-sale-status" type="button" data-id="${sale.id}" data-status="Pago">Marcar como paga</button>
               <button class="ghost-button change-sale-status" type="button" data-id="${sale.id}" data-status="Cancelado">Cancelar venda</button>`
            : !scope.archived && isAdmin() && sale.status === "Pago"
              ? `<button class="ghost-button change-sale-status" type="button" data-id="${sale.id}" data-status="Pendente">Voltar para pendente</button>`
              : !scope.archived && isAdmin()
                ? `<button class="secondary-button change-sale-status" type="button" data-id="${sale.id}" data-status="Pendente">Reabrir venda</button>`
                : ""
        }
        ${
          !scope.archived && isAdmin()
            ? `<button class="delete-sale" type="button" data-id="${sale.id}" title="Remover venda">Remover venda</button>`
            : ""
        }
      </div>
    `;
    el.salesCards.append(card);
  }

  el.salesCards.querySelectorAll(".change-sale-status").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isAdmin()) return;
      const sale = state.sales.find((item) => item.id === button.dataset.id);
      const nextStatus = button.dataset.status;
      if (!sale || !["Pago", "Pendente", "Cancelado"].includes(nextStatus)) return;
      const confirmed = window.confirm(
        `Deseja alterar a venda de ${currency(sale.amount)} de ${sale.status} para ${nextStatus}?`,
      );
      if (!confirmed) return;
      sale.status = nextStatus;
      saveState();
      render();
    });
  });

  el.salesCards.querySelectorAll(".delete-sale").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isAdmin()) return;
      const deletedSale = state.sales.find((sale) => sale.id === button.dataset.id);
      if (!deletedSale) return;
      const confirmed = window.confirm(
        `Deseja remover a venda de ${currency(deletedSale.amount)}? Ela podera ser recuperada antes do fechamento semanal.`,
      );
      if (!confirmed) return;
      if (deletedSale) saveDeletedSale(deletedSale);
      state.sales = state.sales.filter((sale) => sale.id !== button.dataset.id);
      saveState();
      render();
    });
  });
}

function renderPreview() {
  const sale = {
    amount: parseCurrency(el.saleAmount.value),
    format: el.saleFormat.value,
    agentIds: getSelectedAgentIds(),
  };
  const calc = calculateSale(sale);
  el.previewMachineFee.textContent = currency(calc.machineFee);
  el.previewMachineFee.closest(".machine-field").classList.toggle("hidden", calc.machineFee <= 0);
  el.previewTax.textContent = currency(calc.bankTax);
  el.previewFirmCash.textContent = currency(calc.firmCash);
  el.previewBankTaxNet.textContent = currency(calc.bankTaxNet);
  el.previewLine1.textContent = currency(calc.line1Commission);
  el.previewLine2.textContent = currency(calc.line2Commission);
  el.previewLine3.textContent = currency(calc.line3Commission);
  el.previewFirm.textContent = currency(calc.firm);
  el.previewTotalFirm.textContent = currency(calc.totalFirm);
  el.salePreview.textContent = `${currency(calc.totalFirm)} total firma`;
}

function renderSimulation() {
  const sellerCount = Number(el.simulationSellers.value || 2);
  const sale = {
    amount: parseCurrency(el.simulationAmount.value),
    format: el.simulationFormat.value,
    agentIds: ["SIM1", "SIM2", "SIM3"].slice(0, sellerCount),
  };
  const calc = calculateSale(sale);
  const rows = [
    { label: "Formato", value: calc.formatLabel },
    { label: "Valor simulado", value: currency(calc.amount) },
    { label: "Taxa NFC", value: currency(calc.machineFee), hidden: calc.machineFee <= 0 },
    { label: "Desconto bancario", value: currency(calc.bankTax) },
    { label: "Base vendedores", value: currency(calc.baseLine1) },
    { label: "Vendedor 1", value: currency(calc.line1Commission), hidden: sellerCount < 1 },
    { label: "Vendedor 2", value: currency(calc.line2Commission), hidden: sellerCount < 2 },
    { label: "Vendedor 3", value: currency(calc.line3Commission), hidden: sellerCount < 3 },
    { label: "Total vendedores", value: currency(calc.totalLines) },
    { label: "Sobra firma", value: currency(calc.firm) },
    { label: "Total firma", value: currency(calc.totalFirm), total: true },
  ];
  el.simulationPreview.textContent = `${currency(calc.totalFirm)} total firma`;
  el.simulationResult.innerHTML = rows
    .filter((row) => !row.hidden)
    .map(
      (row) => `
        <article class="simulation-result-item ${row.total ? "total" : ""}">
          <span>${row.label}</span>
          <strong>${row.value}</strong>
        </article>
      `,
    )
    .join("");
}

function render() {
  renderSettings();
  renderAgentSelect();
  renderAgents();
  renderSummary();
  renderWeeklyReport();
  renderSales();
  renderExpenses();
  renderLinePayments();
  renderFirmCommission();
  renderPreview();
  renderSimulation();
  el.undoResetBtn.classList.toggle("hidden", !loadBackup());
  setLoggedView();
}

function nextAgentId() {
  const max = state.agents.reduce((highest, agent) => {
    const number = Number(String(agent.id).replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);
  return `AG${String(max + 1).padStart(3, "0")}`;
}

function exportCsv() {
  const salesHeader = [
    "Data",
    "Cliente",
    "Formato",
    "IDs Agentes",
    "Agentes",
    "Setores",
    "Status",
    "Valor",
    "Taxa NFC",
    "Desconto bancario",
    "Imposto real",
    "Caixa empresa",
    "Base vendedor 1",
    "Comissao vendedor 1",
    "Base vendedor 2",
    "Comissao vendedor 2",
    "Base vendedor 3",
    "Comissao vendedor 3",
    "Total vendedores",
    "Firma",
    "Total firma",
    "Observacao",
  ];
  const salesRows = state.sales.map((sale) => {
    const calc = calculateSale(sale);
    const agents = getSaleAgents(sale);
    return [
      sale.date,
      sale.client,
      calc.formatLabel,
      getSaleAgentIds(sale).join(", "),
      agents.map((agent) => agent.name).join(", "),
      agents.map((agent) => agent.sector).join(", "),
      sale.status,
      calc.amount,
      calc.machineFee,
      calc.bankTax,
      calc.bankTaxNet,
      calc.firmCash,
      calc.baseLine1,
      calc.line1Commission,
      calc.baseLine2,
      calc.line2Commission,
      calc.baseLine3,
      calc.line3Commission,
      calc.totalLines,
      calc.firm,
      calc.totalFirm,
      sale.notes,
    ];
  });
  const expensesHeader = ["Data", "Descricao", "Valor", "Status", "Data do pagamento"];
  const expenseRows = state.expenses.map((expense) => [
    expense.date,
    expense.description,
    expense.amount,
    expense.status,
    expense.paidDate || "",
  ]);
  const csv = [["VENDAS"], salesHeader, ...salesRows, [], ["DESPESAS"], expensesHeader, ...expenseRows]
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "vendas-consignado.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

el.saleDate.value = todayISO();
el.expenseDate.value = todayISO();
el.firmAllocationDate.value = todayISO();
setCurrencyInput(el.saleAmount, 0);
setCurrencyInput(el.expenseAmount, 0);
setCurrencyInput(el.simulationAmount, 0);
setCurrencyInput(el.firmAllocationAmount, 0);

el.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!login(el.loginUser.value, el.loginPassword.value)) {
    el.loginError.textContent = "Usuario ou senha incorretos.";
    return;
  }
  el.loginError.textContent = "";
  el.loginPassword.value = "";
  render();
  loadStateFromCloud();
});

el.logoutBtn.addEventListener("click", logout);
el.downloadFirmReceiptBtn.addEventListener("click", () => {
  el.downloadFirmReceiptBtn.disabled = true;
  el.downloadFirmReceiptBtn.textContent = "Gerando...";
  try {
    downloadFirmReceipt();
  } finally {
    setTimeout(() => {
      el.downloadFirmReceiptBtn.disabled = false;
      el.downloadFirmReceiptBtn.textContent = "Baixar comprovante";
    }, 500);
  }
});
el.printFirmReceiptBtn.addEventListener("click", printFirmReceipt);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  el.installAppBtn.classList.remove("hidden");
});

el.installAppBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    alert("No iPhone, toque em Compartilhar e depois em Adicionar a Tela de Inicio.");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  el.installAppBtn.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  el.installAppBtn.classList.add("hidden");
});

el.saleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  const amount = parseCurrency(el.saleAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Informe um valor de venda maior que zero.");
    el.saleAmount.focus();
    return;
  }
  const agentIds = getSelectedAgentIds();
  if (agentIds.length < 2) {
    alert("Informe Vendedor 1 e Vendedor 2 para salvar a venda.");
    return;
  }
  const selectedAgents = [el.saleAgent1.value, el.saleAgent2.value, el.saleAgent3.value].map(findAgent);
  if (!selectedAgents[0] || selectedAgents[0].sector !== "1 Linha") {
    alert("O Agente 1 precisa ser cadastrado como Vendedor 1.");
    return;
  }
  if (!selectedAgents[1] || selectedAgents[1].sector !== "2 Linha") {
    alert("O Agente 2 precisa ser cadastrado como Vendedor 2.");
    return;
  }
  if (selectedAgents[2] && !["2 Linha", "3 Linha"].includes(selectedAgents[2].sector)) {
    alert("O Agente 3 precisa ser cadastrado como Vendedor 2 ou Vendedor 3.");
    return;
  }
  if (el.saleAgent3.value && new Set([el.saleAgent1.value, el.saleAgent2.value, el.saleAgent3.value]).size < 3) {
    alert("Selecione tres agentes diferentes.");
    return;
  }
  const sale = {
    id: crypto.randomUUID(),
    date: el.saleDate.value,
    client: "",
    agentIds,
    amount,
    format: el.saleFormat.value,
    status: el.saleStatus.value,
    notes: el.saleNotes.value.trim(),
  };
  sale.calculationSnapshot = calculateSale(sale, false);
  state.sales.unshift(sale);
  el.saleForm.reset();
  el.saleDate.value = todayISO();
  el.saleFormat.value = "standard";
  setCurrencyInput(el.saleAmount, 0);
  saveState();
  render();
});

el.agentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  const agentName = el.agentName.value.trim();
  if (!agentName) {
    alert("Informe o nome do agente.");
    return;
  }
  const duplicateAgent = state.agents.some(
    (agent) =>
      agent.active &&
      agentNameKey(agent.name) === agentNameKey(agentName) &&
      normalizeSector(agent.sector) === el.agentSector.value,
  );
  if (duplicateAgent) {
    alert("Ja existe esse agente ativo nessa linha.");
    return;
  }
  state.agents.push({
    id: nextAgentId(),
    name: agentName,
    sector: el.agentSector.value,
    active: true,
  });
  el.agentForm.reset();
  saveState();
  render();
});

el.agentEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  const agent = state.agents.find((item) => item.id === el.agentEditId.value && item.active);
  if (!agent) {
    el.agentEditDialog.close();
    return;
  }
  const agentName = el.agentEditName.value.trim();
  if (!agentName) {
    alert("Informe o nome do agente.");
    return;
  }
  const duplicateAgent = state.agents.some(
    (item) =>
      item.active &&
      item.id !== agent.id &&
      agentNameKey(item.name) === agentNameKey(agentName) &&
      normalizeSector(item.sector) === el.agentEditSector.value,
  );
  if (duplicateAgent) {
    alert("Ja existe esse agente ativo nessa linha.");
    return;
  }
  agent.name = agentName;
  agent.sector = el.agentEditSector.value;
  el.agentEditDialog.close();
  saveState();
  render();
});

el.agentEditCancel.addEventListener("click", () => el.agentEditDialog.close());
el.agentEditCancelTop.addEventListener("click", () => el.agentEditDialog.close());

el.expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  const amount = parseCurrency(el.expenseAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Informe um valor de despesa maior que zero.");
    el.expenseAmount.focus();
    return;
  }
  state.expenses.unshift({
    id: crypto.randomUUID(),
    date: el.expenseDate.value,
    description: el.expenseDescription.value.trim(),
    amount,
    status: "Pendente",
  });
  el.expenseForm.reset();
  el.expenseDate.value = todayISO();
  setCurrencyInput(el.expenseAmount, 0);
  saveState();
  render();
});

el.transferCashToCapitalBtn.addEventListener("click", () => {
  if (!isAdmin()) return;
  const available = summarize().cashBalance;
  if (available <= 0) {
    alert("Nao existe sobra disponivel no caixa para transferir.");
    return;
  }
  if (!window.confirm(`Confirma o envio de toda a sobra de ${currency(available)} para o giro de capital?`)) return;
  transferCashBalanceToWorkingCapital(available);
  saveState();
  render();
});

el.firmAllocationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return;
  const amount = parseCurrency(el.firmAllocationAmount.value);
  const summary = getFirmAllocationSummary();
  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Informe um valor maior que zero.");
    return;
  }
  if (amount > summary.available) {
    alert(`A sobra disponivel da firma e ${currency(summary.available)}.`);
    return;
  }
  const type = el.firmAllocationType.value;
  const labels = {
    prolabore_mm: "Pro-labore MM",
    prolabore_fort: "Pro-labore FORT",
    working_capital: "Giro de capital",
  };
  if (!window.confirm(`Confirma ${currency(amount)} para ${labels[type]}?`)) return;
  state.firmAllocations.unshift({
    id: crypto.randomUUID(),
    type,
    amount,
    date: el.firmAllocationDate.value,
    notes: el.firmAllocationNotes.value.trim(),
    createdBy: currentSession(),
    createdAt: new Date().toISOString(),
  });
  if (type === "working_capital") {
    state.workingCapitalBalance = Number(state.workingCapitalBalance || 0) + amount;
  }
  el.firmAllocationForm.reset();
  el.firmAllocationDate.value = todayISO();
  setCurrencyInput(el.firmAllocationAmount, 0);
  saveState();
  render();
});

el.settingsForm.addEventListener("input", () => {
  if (!isAdmin()) return;
  const bankTaxRate = sanitizeRate(el.bankTaxRate.value);
  const firmCashRate = Math.min(sanitizeRate(el.firmCashRate.value), bankTaxRate);
  state.settings = {
    bankTaxRate,
    firmCashRate,
    line1Rate: sanitizeRate(el.line1Rate.value),
    line2Rate: sanitizeRate(el.line2Rate.value),
    line2With3Rate: sanitizeRate(el.line2With3Rate.value),
    line3Rate: sanitizeRate(el.line3Rate.value),
  };
  el.bankTaxRate.value = state.settings.bankTaxRate;
  el.firmCashRate.value = state.settings.firmCashRate;
  saveState();
  renderSummary();
  renderAgents();
  renderSales();
  renderLinePayments();
  renderFirmCommission();
  renderPreview();
});

[el.saleAmount, el.saleFormat, el.saleAgent1, el.saleAgent2, el.saleAgent3, el.saleStatus].forEach((input) =>
  input.addEventListener("input", renderPreview),
);
[el.simulationAmount, el.simulationFormat, el.simulationSellers].forEach((input) =>
  input.addEventListener("input", renderSimulation),
);
el.simulationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderSimulation();
});
[el.saleAmount, el.expenseAmount, el.simulationAmount, el.firmAllocationAmount].forEach((input) => {
  input.addEventListener("input", () => {
    if (input === el.saleAmount) renderPreview();
    if (input === el.simulationAmount) renderSimulation();
  });
  input.addEventListener("focus", () => {
    if (parseCurrency(input.value) === 0) input.value = "";
  });
  input.addEventListener("blur", () => formatCurrencyInput(input));
});
document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.viewTarget));
});
el.statusFilter.addEventListener("change", renderSales);
el.weekArchiveFilter.addEventListener("change", renderSales);
el.exportCsvBtn.addEventListener("click", exportCsv);
el.recoverDeletedSalesBtn.addEventListener("click", () => {
  if (!isAdmin()) return;
  const currentIds = new Set(state.sales.map((sale) => sale.id));
  const backupSales = loadBackup()?.sales || [];
  const candidates = [...loadDeletedSales(), ...backupSales].filter((sale, index, list) => {
    return !currentIds.has(sale.id) && list.findIndex((item) => item.id === sale.id) === index;
  });

  if (!candidates.length) {
    alert("Nenhuma venda apagada foi encontrada no backup interno.");
    return;
  }

  candidates.forEach((sale) => {
    if (!sale.calculationSnapshot || sale.calculationSnapshot.snapshotVersion !== 5) {
      sale.calculationSnapshot = calculateSale(sale, false);
    }
  });
  state.sales = [...candidates, ...state.sales];
  localStorage.removeItem(DELETED_SALES_KEY);
  saveState();
  render();
  alert(`${candidates.length} venda(s) recuperada(s) com sucesso.`);
});
el.deleteAllRecordsBtn.addEventListener("click", () => {
  if (!isAdmin()) return;
  const confirmed = window.confirm(
    "ATENCAO: todas as vendas e despesas serao apagadas definitivamente. Nao sera possivel recuperar. Deseja continuar?",
  );
  if (!confirmed) return;

  const finalConfirmation = window.confirm(
    "Tem certeza que deseja fazer isso? Esta exclusao e definitiva e nao podera ser recuperada.",
  );
  if (!finalConfirmation) return;

  state.sales = [];
  state.expenses = [];
  state.firmAllocations = [];
  state.weeklyClosedAt = new Date().toISOString();
  localStorage.removeItem(BACKUP_KEY);
  localStorage.removeItem(DELETED_SALES_KEY);
  saveState();
  render();
  alert("Fechamento semanal concluido. Vendas e despesas foram apagadas definitivamente.");
});
el.resetDemoBtn.addEventListener("click", () => {
  if (!isAdmin()) return;
  saveBackup();
  state = structuredClone(defaults);
  migrateCalculationSnapshots();
  saveState();
  render();
});

el.undoResetBtn.addEventListener("click", () => {
  if (!isAdmin()) return;
  const backup = loadBackup();
  if (!backup) return;
  state = backup;
  migrateCalculationSnapshots();
  saveState();
  localStorage.removeItem(BACKUP_KEY);
  render();
});

render();
if (currentSession()) {
  loadStateFromCloud();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  });
}
