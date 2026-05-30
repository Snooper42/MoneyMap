/* MoneyMap import workflow.
   Owns file support, batch creation, and post-import sorting. */
(function(){
  'use strict';

  const SUPPORTED_IMPORT_FILE = /\.(csv|txt|tsv|tab|psv)$/i;

  const originalMapRow = window.mapRow;

  function inferAccountName(fileName){
    const base = stripCsvName(fileName || 'Imported account');
    return base.replace(/\b(transactions?|statement|activity|history|export|download|account)\b/gi,'').replace(/\s+/g,' ').trim() || base;
  }

  if(typeof originalMapRow === 'function' && !originalMapRow.__v08Wrapped){
    window.mapRow = function(row, map, meta={}){
      const tx = originalMapRow.call(this, row, map, meta);
      if(tx && (!tx.account || tx.account === 'General')){
        const fallback = meta.defaultAccount || inferAccountName(meta.fileName || 'Imported account');
        if(fallback) tx.account = fallback;
      }
      return tx;
    };
    window.mapRow.__v08Wrapped = true;
  }

  function isSupportedFile(file){
    const name = String(file?.name || '');
    const type = String(file?.type || '');
    return SUPPORTED_IMPORT_FILE.test(name) || type.includes('csv') || type.includes('text') || type === 'application/vnd.ms-excel';
  }

  function requiredMappingsReady(){
    return !!(pendingImport && pendingImport.files && pendingImport.files.every(f => f.mapping.date && f.mapping.description && (f.mapping.amount || f.mapping.debit || f.mapping.credit)));
  }

  async function handleImportFiles(files){
    const supported = [...files].filter(isSupportedFile);
    if(!supported.length){ toast('No supported delimited files were found. Use CSV, TSV, TXT, or similar bank exports.'); return; }
    const parsed = [];
    for(const file of supported){
      const text = await file.text();
      const p = parseCSV(text);
      if(!p.rows.length || !p.headers.length) continue;
      const init = initialMappingFor(p.headers);
      parsed.push({
        id: uid('file'),
        name: file.name,
        headers: p.headers,
        rows: p.rows,
        signature: headerSignature(p.headers),
        mapping: init.mapping,
        savedMappingId: init.saved?.id || null,
        profileName: init.saved?.name || stripCsvName(file.name),
        defaultAccount: inferAccountName(file.name),
        delimiter: p.delimiter || ','
      });
    }
    if(!parsed.length){ toast('The files loaded, but no transaction rows were detected.'); return; }
    pendingImport = { files: parsed, active: 0, summary: null };
    renderMapping();
    setStep('stepMap');
    try{ if(requiredMappingsReady()) prepareImportSummary(); }catch(e){}
    toast(`Loaded ${parsed.length} file${parsed.length===1?'':'s'}. Mapping and preview are ready.`);
    try{ if(typeof renderV07 === 'function') renderV07(); }catch(e){}
  }

  function sortTransactionsNewestFirst(){
    try{
      state.transactions = (state.transactions || []).slice().sort((a,b) => String(b.date || '').localeCompare(String(a.date || '')));
    }catch(e){}
  }

  const originalCommitImport = window.commitImport;
  if(typeof originalCommitImport === 'function' && !originalCommitImport.__v08Wrapped){
    window.commitImport = function(){
      const before = Array.isArray(state?.transactions) ? state.transactions.length : 0;
      const result = originalCommitImport.apply(this, arguments);
      sortTransactionsNewestFirst();
      try{ saveState(); }catch(e){}
      requestAnimationFrame(() => {
        const after = Array.isArray(state?.transactions) ? state.transactions.length : before;
        const added = Math.max(0, after - before);
        try{ showView('overview'); }catch(e){}
        try{ toast(added ? `Imported ${added} new transactions. Charts and history are updated.` : 'Import completed. No new transactions were added.'); }catch(e){}
        try{ if(typeof renderAll === 'function') renderAll(); }catch(e){}
      });
      return result;
    };
    window.commitImport.__v08Wrapped = true;
  }

  window.handleFiles = handleImportFiles;
  window.MoneyMapImportWorkflow = Object.freeze({
    isSupportedFile,
    inferAccountName,
    requiredMappingsReady,
    handleImportFiles,
    sortTransactionsNewestFirst
  });
})();
