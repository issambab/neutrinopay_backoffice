# neutrinopay_backoffice

## Wallet Backoffice

Le backoffice consomme les endpoints wallet reels du backend via des routes proxy Next.

Routes proxy disponibles :

- `GET /api/wallets/[walletId]/balance`
- `GET /api/wallets/[walletId]/reconciliation`
- `GET /api/cash/operations/[operationId]`

Endpoints backend appeles :

- `GET /api/v1/wallets/{walletId}/balance`
- `GET /api/v1/wallets/{walletId}/reconciliation`
- `GET /api/v1/cash-operations/{operationId}`

Conventions :

- Le solde vient de Formance, pas de la table wallet locale.
- Le compte cible est `users:{customerRef}:available`.
- L'asset MVP est `TND/2`.
- La reconciliation compare le solde Formance avec le solde projete depuis `transaction_views`.

Interface branchee :

- La page `dashboard/users/[userId]` affiche une carte `Solde ledger` pour les clients avec wallet.
- La carte affiche le solde Formance, la projection locale, l'ecart et le statut `reconcilie` / `ecart detecte`.
- Les montants Formance sont formates selon la precision de l'asset (`TND/2` = deux decimales).
- La page affiche aussi `Historique wallet` avec les 10 derniers mouvements `transaction_views` postes.
- Chaque mouvement montre direction, statut, type operation, montant signe, asset, reference ledger et date.
- Chaque ligne d'historique propose un panneau `Detail mouvement wallet` avec reference ledger, ids techniques et metadata cash/ledger.
- Quand les metadata contiennent `cash_operation_id`, le panneau charge le detail Cash-in/Cash-out source via la route proxy cash.
- Le drawer affiche le statut operationnel, l'agence, le client, l'agent, les timestamps et la transaction ledger sans exposer de code OTP.

## Cash Operations Monitoring

La page `dashboard/cash-operations` supervise les operations Cash-in/Cash-out agents.

Backend consomme :

- `GET /api/v1/cash-operations`

Filtres disponibles :

- `operationType` : `cash_in` / `cash_out`.
- `status` : `otp_pending`, `prepared`, `posted`, `failed`, `cancelled`, `expired`.
- `q` : recherche client, agent, agence ou reference ledger.
- pagination et tri : `page`, `size`, `sort`.

Interface :

- cartes de synthese sur la page courante.
- table avec type, client, agence, agent, statut, montant, ledger transaction et dates.
- lien direct vers le detail utilisateur/wallet client pour investiguer l'historique et la reconciliation.
