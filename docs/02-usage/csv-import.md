# CSV Import

MoneyMap supports local CSV import for users who prefer manual control over bank-connected sync.

---

## Current workflow

The import workflow is designed around these steps:

1. Select a CSV file from the local device.
2. Map CSV columns to MoneyMap fields.
3. Review import results.
4. Send imported transactions into the review workflow.
5. Clean merchants, approve categories, and improve rules from Review.

---

## Recommended positioning

Describe the feature as:

> CSV import with column mapping, duplicate-aware behavior, and review.

Avoid describing it as:

- Universal bank import
- Automatic bank sync
- Perfect support for every institution
- Real-time transaction sync

---

## User expectations

CSV exports vary by bank and card issuer. Users may need to map columns manually and review results before accepting imported data.

---

## Future improvements

- Saved import profiles by institution or export format.
- Auto-mapping suggestions based on column names.
- Better duplicate detection.
- Fuzzy merchant matching.
- Multi-file import.
- Import history.
- Reprocess or revert import batches.
- Clear skipped-row and error summaries.
