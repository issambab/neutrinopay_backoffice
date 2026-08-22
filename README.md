# neutrinopay_backoffice test

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

- Le solde vient de Ledger, pas de la table wallet locale.
- Le compte cible est `users:{customerRef}:available`.
- L'asset MVP est `TND/2`.
- La reconciliation compare le solde Ledger avec le solde projete depuis `transaction_views`.

Interface branchee :

- La page `user/dashboard` affiche le solde disponible client depuis Ledger via `GET /api/v1/customer/wallet/balance`.
- Si Ledger est indisponible, le dashboard garde un fallback local pour ne pas bloquer l'affichage, mais la source est marquee `Local fallback`.
- La page `dashboard/users/[userId]` affiche une carte `Solde ledger` pour les clients avec wallet.
- La carte affiche le solde Ledger, la projection locale, l'ecart et le statut `reconcilie` / `ecart detecte`.
- Les montants Ledger sont formates selon la precision de l'asset (`TND/2` = deux decimales).
- La page affiche aussi `Historique wallet` avec les 10 derniers mouvements `transaction_views` postes.
- Chaque mouvement montre direction, statut, type operation, montant signe, asset, reference ledger et date.
- Chaque ligne d'historique propose un panneau `Detail mouvement wallet` avec reference ledger, ids techniques et metadata cash/ledger.
- Quand les metadata contiennent `cash_operation_id`, le panneau charge le detail Cash-in/Cash-out source via la route proxy cash.
- Le drawer affiche le statut operationnel, l'agence, le client, l'agent, les timestamps et la transaction ledger sans exposer de code OTP.

## Workspace Sidebars

Les espaces `agent`, `merchant` et `user` utilisent le meme composant de sidebar que l'admin via `Sidebar`, `SidebarProvider` et `SidebarMenuButton`.

Regles UI :

- garder le meme style de navigation, collapse et mobile drawer que le dashboard admin.
- le sidebar super admin expose le groupe `Wallets` avec `All Wallets`, `Customer Wallets`, `Agent Wallets` et `Merchant Wallets`.
- afficher un bloc de solde uniquement dans le sidebar client.
- le bloc client affiche le solde reel Ledger via `GET /api/v1/customer/wallet/balance`.
- agent et marchand n'affichent pas de bloc solde dans le sidebar ; leurs soldes restent dans les pages metier dediees.

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

## Agents Cash Admin

La page `dashboard/agents` liste les agents cash du tenant avec leurs contrats agence.

Sources backend :

- `GET /api/v1/iam/users?type=cash_agent`
- `GET /api/v1/agencies`
- `GET /api/v1/agencies/{agencyId}/agents`

Interface :

- filtres par recherche, statut agent et statut contrat.
- pagination par URL avec `page`, `size` et `sort`.
- affichage du statut KYC, de l'agence rattachee, de la commission agent, de la part plateforme et des limites.
- lien vers `dashboard/agencies` pour modifier l'affectation, le contrat ou les commissions.
- bloc `Activation reseau cash` par agent avec les controles `agent actif`, `agence active` et `contrat actif`.
- actions rapides `Activer agent`, `Activer agence` et `Activer contrat`; la ligne devient `Pret Cash-in/Cash-out` uniquement quand les trois statuts sont actifs.

## Wallets Admin

Le groupe super admin `Wallets` expose quatre vues :

- `dashboard/wallets` : tous les wallets du tenant.
- `dashboard/wallets/customers` : wallets clients (`ownerType=user`).
- `dashboard/wallets/agents` : wallets agents cash (`ownerType=cash_agent`).
- `dashboard/wallets/merchants` : wallets marchands (`ownerType=business`).

Chaque page affiche :

- KPI page : total, actifs, balance Ledger disponible sur la page, owners distincts.
- filtres `ownerId` et `status`.
- pagination, taille page et tri.
- table avec wallet, nom/email owner, type, statut, balance Ledger reelle et compte ledger principal.
- la balance Ledger par ligne est completee cote serveur avec `GET /api/v1/wallets/{walletId}/balance`, le meme endpoint que le detail utilisateur.
- si la lecture Ledger d'une ligne echoue, la table garde le wallet visible avec `Indisponible`.
- lien detail vers `dashboard/wallets/{walletId}` pour ouvrir le wallet, sa balance Ledger, sa reconciliation et ses mouvements.
- le detail wallet pagine l'historique avec `txPage`, `txSize` et `txSort`.
- depuis le detail wallet client, un bouton permet aussi d'ouvrir `dashboard/users/{ownerId}`.

## Agent Cash-in UI

Les pages `agent/cash-in` et `agent/cash-out` exposent les workflows agent testables avec Ledger Docker. Le dashboard agent reste un cockpit de suivi et ne contient plus les formulaires operationnels.

Routes proxy disponibles :

- `GET /api/agent/customers/search?q=...`
- `POST /api/agent/cash-in`
- `POST /api/agent/cash-out`
- `PATCH /api/agent/cash-operations/[operationId]/confirm`
- `POST /api/agent/cash-operations/[operationId]/execute`

Endpoints backend appeles :

- `GET /api/v1/agent/me`
- `GET /api/v1/agent/float-balance`
- `GET /api/v1/agent/earnings-balance`
- `GET /api/v1/agent/physical-cash-balance`
- `GET /api/v1/agent/float-topups`
- `GET /api/v1/agent/customers/search`
- `GET /api/v1/agent/cash-operations?operationType=cash_in`
- `GET /api/v1/agent/cash-operations?operationType=cash_out`
- `POST /api/v1/agent/cash-in`
- `POST /api/v1/agent/cash-out`
- `PATCH /api/v1/agent/cash-operations/{operationId}/confirm`
- `POST /api/v1/agent/cash-operations/{operationId}/execute`

Workflow UI :

- afficher l'agence, le contrat agent et le float reel Ledger sur la page dediee.
- afficher la commission contrat et la part plateforme configuree.
- rechercher le client et afficher son eligibilite wallet/KYC.
- saisir le montant brut encaisse en `TND`.
- pour Cash-out, saisir le cash remis au client ; l'UI affiche commission, part agent, part plateforme et total debite wallet avant finalisation.
- creer l'operation en statut `otp_pending`.
- confirmer l'OTP client pour passer l'operation a `prepared`.
- poster l'operation dans Ledger via l'endpoint `execute`.
- apres un posting Cash-in ou Cash-out reussi, recharger automatiquement le tableau de la page et les metriques agent.
- afficher les operations recentes scopees a l'agent connecte.
- afficher les listes paginees des operations Cash-in et Cash-out dans leurs pages dediees.
- afficher les earnings agent en `TND` depuis le compte Ledger `agents:{agentCode}:earnings`.
- afficher le cash physique agent calcule depuis les Cash-in postes moins les Cash-out postes. Les top-ups float restent affiches comme historique separe.
- afficher les alimentations float recentes de l'agent connecte depuis `GET /api/v1/agent/float-topups`.
- exposer la page agent `agent/float-topups` pour l'historique pagine, filtrable par statut et recherche.
- afficher le KPI `Net clients` uniquement a partir des Cash-in `posted`.
- ne pas afficher de bloc `Revenu plateforme` dans l'espace agent ; ce revenu reste une lecture finance/admin.
- dans `Operations recentes`, afficher le net client, le brut recu et la commission agent en `TND` quand le breakdown est disponible.
- afficher le solde float reel Ledger du compte `agents:{agentRef}:float`.

Le code OTP n'est jamais affiche par l'UI. En environnement dev, il doit etre recupere depuis le canal de livraison OTP configure localement.

## Agent Operations UI

La page `agent/operations` expose le journal de caisse agent avec pagination.

Endpoint backend appele :

- `GET /api/v1/agent/cash-operations`

Pagination et tri :

- `page` : index de page zero-based.
- `size` : nombre de lignes par page.
- `sort` : `createdAt`, `amountMinor`, `operationType`, `status` ou `postedAt` avec direction `asc` / `desc`.

Interface :

- synthese du float reel, du total historique, des operations postees et en cours sur la page.
- table agent-scopee avec type, client, statut, flux cash, commissions, reference ledger et dates.
- pour les Cash-in, affichage du net client, du brut recu et du partage commission agent / plateforme quand le backend fournit le breakdown.
- navigation paginee premiere/precedente/suivante/derniere page.
- aucun filtre global admin n'est expose cote agent pour garder le journal centre sur sa propre caisse.

Regle commission Cash-in :

- `amountMinor` represente le brut encaisse par l'agent.
- Le client recoit le net apres commission.
- La part agent va vers `agents:{agentCode}:earnings`.
- La part plateforme va vers `neutrinobank:revenue:commissions`.
- Exemple : `100 TND`, commission `6%`, part plateforme `50%` => client `94 TND`, agent `3 TND`, plateforme `3 TND`.

## Agencies Admin UI

La page `dashboard/agencies` pilote le reseau agences et les contrats agents cash.

Routes proxy disponibles :

- `POST /api/cash/agencies/[agencyId]/agents`
- `PATCH /api/cash/agencies/[agencyId]/agents/[contractId]`
- `PATCH /api/cash/agencies/[agencyId]/agents/[contractId]/status`

Interface :

- cockpit fintech pour suivre agences, agents cash et contrats actifs.
- creation d'agence et affectation agent.
- edition inline des contrats agents : statut, plafonds, commission agent en pourcentage et part plateforme.
- rappel que les changements commission affectent les nouvelles operations, les operations preparees gardant leur breakdown fige.

## Agent Float Top-ups

La page `dashboard/agent-float-topups` gere l'alimentation du float electronique des agents cash.

Routes proxy disponibles :

- `POST /api/cash/agent-float-topups`
- `POST /api/cash/agent-float-topups/[topupId]/approve`
- `POST /api/cash/agent-float-topups/[topupId]/reject`

Endpoints backend appeles :

- `POST /api/v1/agent-float-topups`
- `GET /api/v1/agent-float-topups`
- `GET /api/v1/agent-float-topups/{topupId}`
- `POST /api/v1/agent-float-topups/{topupId}/approve`
- `POST /api/v1/agent-float-topups/{topupId}/reject`

Permissions backend attendues :

- `cash.float.read` pour listing/detail.
- `cash.float.manage` pour creation d'une demande `pending`.
- `cash.float.approve` pour approve/reject.

Interface :

- creation d'une demande a partir d'une agence active et d'un contrat agent actif.
- listing filtre par statut, agence et recherche preuve/ledger.
- panneau detail avec comptes ledger, preuve, dates, statut et erreur Ledger.
- approval avec `idempotencyKey`, posting Ledger `treasury:cash:vault -> agents:{agentCode}:float`.
- rejection motivee sans appel Ledger.
- asset backend/Ledger conserve : `TND/2`.
