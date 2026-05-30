/* MoneyMap import parsers.
   Handles delimited bank exports only, no network access. */
(function(){
  'use strict';

  function chooseDelimiter(text){
    const candidates = [',','\t',';','|'];
    const sampleLines = String(text || '').replace(/^\uFEFF/,'').split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 12);
    if(!sampleLines.length) return ',';
    let best = ',';
    let bestScore = -1;
    candidates.forEach(delim => {
      let total = 0;
      let consistent = 0;
      let prevCount = null;
      sampleLines.forEach(line => {
        const count = splitDelimitedLine(line, delim).length;
        total += count;
        if(prevCount !== null && count === prevCount) consistent += 1;
        prevCount = count;
      });
      const avg = total / sampleLines.length;
      const score = (avg > 1 ? avg * 10 : 0) + consistent;
      if(score > bestScore){ bestScore = score; best = delim; }
    });
    return best;
  }

  function splitDelimitedLine(line, delim){
    const out = [];
    let cur = '';
    let inQuotes = false;
    for(let i=0;i<line.length;i++){
      const ch = line[i], next = line[i+1];
      if(ch === '"'){
        if(inQuotes && next === '"'){ cur += '"'; i++; }
        else inQuotes = !inQuotes;
      }else if(ch === delim && !inQuotes){
        out.push(cur); cur = '';
      }else{
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  function headerRowScore(row){
    const known = ['date','posted','posting','description','merchant','name','payee','memo','details','amount','debit','credit','deposit','withdrawal','account','card','institution','category','classification'];
    let score = 0;
    const cleaned = row.map(cell => normalizeHeader(cell));
    cleaned.forEach(cell => {
      if(!cell) return;
      if(known.includes(cell)) score += 4;
      else if(known.some(token => cell.includes(token))) score += 2;
      if(/[a-z]/.test(cell) && !/^[0-9.\-]+$/.test(cell)) score += 1;
    });
    score += new Set(cleaned.filter(Boolean)).size === cleaned.filter(Boolean).length ? 1 : 0;
    return score;
  }

  function parseDelimitedTransactions(text){
    const clean = String(text || '').replace(/^\uFEFF/, '');
    const delim = chooseDelimiter(clean);
    const lines = clean.split(/\r\n|\n|\r/);
    const matrix = [];
    let buffer = '';
    let quoteCount = 0;
    lines.forEach(line => {
      buffer += (buffer ? '\n' : '') + line;
      quoteCount += (line.match(/"/g) || []).length;
      if(quoteCount % 2 !== 0) return;
      const row = splitDelimitedLine(buffer, delim);
      if(row.some(v => String(v).trim() !== '')) matrix.push(row.map(v => String(v ?? '').trim()));
      buffer = '';
      quoteCount = 0;
    });
    if(buffer.trim()) matrix.push(splitDelimitedLine(buffer, delim).map(v => String(v ?? '').trim()));
    if(!matrix.length) return {headers:[], rows:[]};
    const maxScan = Math.min(6, matrix.length);
    let headerIndex = 0;
    let best = -Infinity;
    for(let i=0;i<maxScan;i++){
      const score = headerRowScore(matrix[i]);
      if(score > best){ best = score; headerIndex = i; }
    }
    const headers = dedupeHeaders((matrix[headerIndex] || []).map(h => String(h || '').trim() || 'Column'));
    const dataRows = matrix.slice(headerIndex + 1).filter(row => row.some(v => String(v).trim() !== ''));
    const rows = dataRows.map(r => {
      const out = {};
      headers.forEach((h, idx) => { out[h] = String(r[idx] ?? '').trim(); });
      return out;
    });
    return {headers, rows: rows.filter(r => Object.values(r).some(v => String(v).trim() !== '')), delimiter: delim};
  }

  function guessImportMapping(headers){
    const norm = headers.map(normalizeHeader);
    const find = (exact=[], partial=[]) => {
      let idx = norm.findIndex(h => exact.includes(h));
      if(idx >= 0) return headers[idx];
      idx = norm.findIndex(h => partial.some(t => h.includes(t)));
      return idx >= 0 ? headers[idx] : '';
    };
    const amount = find(['amount','transactionamount','signedamount','netamount','value','totalamount'], ['amount','amt','value']);
    const debit = find(['debit','withdrawal','withdrawals','charge','charges','outflow','paidout','moneyout'], ['debit','withdraw','charge','outflow']);
    const credit = find(['credit','deposit','deposits','inflow','paidin','moneyin'], ['credit','deposit','inflow']);
    return {
      date: find(['date','transactiondate','posteddate','postdate','postingdate','authorizeddate','effectivedate','transdate'], ['date','posted','posting','trans']),
      description: find(['description','merchant','name','payee','memo','details','originaldescription','transactiondescription','narrative','item'], ['description','merchant','payee','memo','details','name','narrative']),
      amount: amount && !/creditcard|account|balance/.test(normalizeHeader(amount)) ? amount : '',
      debit,
      credit,
      account: find(['account','accountname','accountnumber','card','cardnumber','source','institution','accounttype'], ['account','card','institution','source']),
      category: find(['category','classification','spendcategory','type'], ['category','classification'])
    };
  }

  window.MoneyMapImportParsers = Object.freeze({
    chooseDelimiter,
    splitDelimitedLine,
    parseDelimitedTransactions,
    guessImportMapping
  });

  window.parseCSV = parseDelimitedTransactions;
  window.guessMapping = guessImportMapping;
})();
