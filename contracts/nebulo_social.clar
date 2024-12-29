;; Nebulo Social Network Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u100))
(define-constant err-invalid-post (err u101))
(define-constant err-user-not-found (err u102))
(define-constant err-insufficient-balance (err u103))

;; Define token
(define-fungible-token nebulo-token)

;; Data structures
(define-map profiles
    principal
    {
        username: (string-ascii 50),
        bio: (string-utf8 500),
        created-at: uint
    }
)

(define-map posts
    uint  ;; post-id
    {
        author: principal,
        content: (string-utf8 1000),
        timestamp: uint,
        tip-balance: uint
    }
)

(define-map follows
    { follower: principal, following: principal }
    bool
)

(define-map post-likes
    { post-id: uint, user: principal }
    bool
)

;; Data variables
(define-data-var post-id-counter uint u0)

;; Profile functions
(define-public (create-profile (username (string-ascii 50)) (bio (string-utf8 500)))
    (ok (map-set profiles tx-sender {
        username: username,
        bio: bio,
        created-at: block-height
    }))
)

(define-read-only (get-profile (user principal))
    (ok (map-get? profiles user))
)

;; Post functions
(define-public (create-post (content (string-utf8 1000)))
    (let
        (
            (post-id (var-get post-id-counter))
        )
        (map-set posts post-id {
            author: tx-sender,
            content: content,
            timestamp: block-height,
            tip-balance: u0
        })
        (var-set post-id-counter (+ post-id u1))
        (ok post-id)
    )
)

;; Follow functions
(define-public (follow-user (user principal))
    (ok (map-set follows {follower: tx-sender, following: user} true))
)

(define-public (unfollow-user (user principal))
    (ok (map-delete follows {follower: tx-sender, following: user}))
)

;; Like functions
(define-public (like-post (post-id uint))
    (ok (map-set post-likes {post-id: post-id, user: tx-sender} true))
)

;; Tip functions
(define-public (tip-post (post-id uint) (amount uint))
    (let
        (
            (post (unwrap! (map-get? posts post-id) err-invalid-post))
            (author (get author post))
        )
        (if (is-ok (ft-transfer? nebulo-token amount tx-sender author))
            (begin
                (map-set posts post-id 
                    (merge post {tip-balance: (+ (get tip-balance post) amount)}))
                (ok true)
            )
            err-insufficient-balance
        )
    )
)

;; Token functions
(define-public (mint-tokens (amount uint) (recipient principal))
    (if (is-eq tx-sender contract-owner)
        (ft-mint? nebulo-token amount recipient)
        err-not-authorized
    )
)

;; Read functions
(define-read-only (get-post (post-id uint))
    (ok (map-get? posts post-id))
)

(define-read-only (get-following (user principal))
    (ok (map-get? follows {follower: user, following: tx-sender}))
)