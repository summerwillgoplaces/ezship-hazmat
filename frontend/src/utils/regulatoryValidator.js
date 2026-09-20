/**
 * Regulatory Quantity & Packaging Validator
 * Evaluates user-input net quantities against US DOT 49 CFR, IATA DGR (66th Edition), and ADR 2026 limits.
 */

export const parseQtyValue = (str) => {
  if (!str) return 0;
  const match = String(str).match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

export const parseQtyUnit = (str) => {
  if (!str) return '';
  const match = String(str).match(/([a-zA-Z]+(?:\s*[a-zA-Z]+)?)/);
  return match ? match[1].trim() : '';
};

export const validateShippingQuantity = (quantityStr, item, regMode = 'IATA') => {
  if (!quantityStr || !String(quantityStr).trim()) {
    return {
      isValid: false,
      status: 'INVALID_INPUT',
      userVal: 0,
      userUnit: '',
      limitVal: 0,
      limitStr: 'N/A',
      paxLimitStr: 'N/A',
      paxLimitVal: 0,
      isForbidden: false,
      isCaoRequired: false,
      requiresAbsorbent: false,
      message: 'Please enter a valid net quantity (e.g. 5.0 L or 10 kg).',
      regulatoryCitation: regMode === '49CFR' ? 'US DOT 49 CFR § 172.101' : regMode === 'ADR' ? 'ADR 2026 Chapter 3.2' : 'IATA DGR Table 4.2',
      badgeColor: '#ef4444'
    };
  }

  const userVal = parseQtyValue(quantityStr);
  const userUnit = parseQtyUnit(quantityStr);

  const citation = regMode === '49CFR'
    ? 'US DOT 49 CFR § 172.101 (Col 9)'
    : regMode === 'ADR'
    ? 'ADR 2026 Chapter 3.2 Table A'
    : 'IATA DGR Table 4.2 (66th Edition)';

  if (userVal <= 0) {
    return {
      isValid: false,
      status: 'INVALID_INPUT',
      userVal,
      userUnit,
      limitVal: 0,
      limitStr: 'N/A',
      paxLimitStr: 'N/A',
      paxLimitVal: 0,
      isForbidden: false,
      isCaoRequired: false,
      requiresAbsorbent: false,
      message: 'Net quantity must be greater than zero.',
      regulatoryCitation: citation,
      badgeColor: '#ef4444'
    };
  }

  let paxStr = '5 L';
  let caoStr = '60 L';
  let isForbidden = false;

  if (item) {
    if (regMode === 'IATA') {
      paxStr = item.iata_dgr?.passenger_aircraft_limit || '5 L';
      caoStr = item.iata_dgr?.cargo_aircraft_limit || '60 L';
    } else if (regMode === '49CFR') {
      paxStr = item.dot_49cfr?.passenger_aircraft_limit || '5 L';
      caoStr = item.dot_49cfr?.cargo_aircraft_limit || '60 L';
    } else {
      paxStr = item.adr_2026?.limited_quantity || '1 L';
      caoStr = item.dot_49cfr?.cargo_aircraft_limit || '60 L';
    }

    if (paxStr.toLowerCase().includes('forbidden') && caoStr.toLowerCase().includes('forbidden')) {
      isForbidden = true;
    }
  }

  const paxVal = paxStr.toLowerCase().includes('forbidden') ? 0 : parseQtyValue(paxStr) || 5.0;
  const caoVal = caoStr.toLowerCase().includes('forbidden') ? 0 : parseQtyValue(caoStr) || (isForbidden ? 0 : 60.0);

  const isLiquid = (item && (item.class_division === '3' || item.class_division === '8' ||
                   String(item.proper_shipping_name).toLowerCase().includes('liquid') ||
                   String(item.proper_shipping_name).toLowerCase().includes('solution'))) ||
                   userUnit.toLowerCase().includes('l') || userUnit.toLowerCase().includes('ml');

  if (isForbidden || caoStr.toLowerCase().includes('forbidden')) {
    return {
      isValid: false,
      status: 'FORBIDDEN',
      userVal,
      userUnit,
      limitVal: 0,
      limitStr: 'FORBIDDEN',
      paxLimitStr: paxStr,
      paxLimitVal: 0,
      isForbidden: true,
      isCaoRequired: false,
      requiresAbsorbent: isLiquid,
      message: `⛔ FORBIDDEN AIR TRANSPORT: This material is prohibited for passenger & cargo aircraft under ${citation}.`,
      regulatoryCitation: citation,
      badgeColor: '#ef4444'
    };
  }

  if (userVal > caoVal) {
    return {
      isValid: false,
      status: 'EXCEEDED',
      userVal,
      userUnit,
      limitVal: caoVal,
      limitStr: caoStr,
      paxLimitStr: paxStr,
      paxLimitVal: paxVal,
      isForbidden: false,
      isCaoRequired: false,
      requiresAbsorbent: isLiquid,
      message: `⛔ LEGAL PACKAGE LIMIT EXCEEDED: ${quantityStr} (${userVal} units) exceeds the maximum legal limit of ${caoStr} per package under ${citation}!`,
      regulatoryCitation: citation,
      badgeColor: '#ef4444'
    };
  }

  if (regMode === 'IATA' && paxVal > 0 && userVal > paxVal) {
    return {
      isValid: true,
      status: 'CAO_REQUIRED',
      userVal,
      userUnit,
      limitVal: caoVal,
      limitStr: caoStr,
      paxLimitStr: paxStr,
      paxLimitVal: paxVal,
      isForbidden: false,
      isCaoRequired: true,
      requiresAbsorbent: isLiquid,
      message: `✈️ CARGO AIRCRAFT ONLY REQUIRED: ${quantityStr} exceeds Passenger Aircraft limit of ${paxStr}, but is legal on Cargo Aircraft Only up to ${caoStr} under ${citation}. CAO handling label is mandatory!`,
      regulatoryCitation: citation,
      badgeColor: '#ea580c'
    };
  }

  return {
    isValid: true,
    status: 'COMPLIANT',
    userVal,
    userUnit,
    limitVal: caoVal,
    limitStr: caoStr,
    paxLimitStr: paxStr,
    paxLimitVal: paxVal,
    isForbidden: false,
    isCaoRequired: false,
    requiresAbsorbent: isLiquid,
    message: `✅ QUANTITY FULLY COMPLIANT: ${quantityStr} is within all legal package quantity limits (Max ${caoStr}) under ${citation}.`,
    regulatoryCitation: citation,
    badgeColor: '#10b981'
  };
};
