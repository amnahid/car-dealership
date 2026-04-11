# ITClanBD Dashboard — Complete Design System
> AI-ready reference for replicating or extending the Clanvent admin dashboard frontend.

---

## 1. Tech Stack

| Layer | Library |
|---|---|
| CSS Framework | Bootstrap 4.6 |
| JS Framework | jQuery + Vue.js |
| Sidebar Menu | MetisMenu |
| Charts | Chart.js + Chartist.js |
| Data Tables | DataTables (Bootstrap 4 theme) |
| Alerts | SweetAlert2 + Toastr.js |
| Date Picker | bootstrap-datepicker |
| Select Inputs | Select2 |
| Rich Text | Summernote (BS4) |
| Scroll | jQuery SlimScroll + SimpleBar |
| Phone Input | intlTelInput |
| Slider | Slick.js |

---

## 2. Fonts

```css
@import url("https://fonts.googleapis.com/css?family=Roboto:400,500");
@import url("https://fonts.googleapis.com/css?family=Sarabun:400,600,700");
@import url("https://fonts.googleapis.com/css?family=Karla:400,400i,700");
```

| Role | Font | Weight |
|---|---|---|
| Body text | Roboto | 400, 500 |
| Headings h1-h6 | Sarabun | 600 |
| Sidebar menu items | Sarabun | normal |
| Login form | Karla | 400, 700 |
| Footer | Sarabun | normal |

```css
body {
  font-family: "Roboto", sans-serif;
  font-size: 16px;
  line-height: 1.7;
}
h1, h2, h3, h4, h5, h6 {
  font-family: "Sarabun", sans-serif;
  font-weight: 600;
  margin: 10px 0;
}
```

---

## 3. Color Palette

### Brand Tokens
```css
:root {
  --primary-color:   #28aaa9;  /* Teal */
  --secondary-color: #2b2d5d;  /* Dark navy */
}
```

### Semantic Colors (Bootstrap overrides)
```css
body background:   #f9fbfd
topbar/sidebar bg: #ffffff
footer bg:         #e9e9ef

/* Text */
text-muted:  #9ca8b3
text-dark:   #2a3142

/* Status */
success: #42ca7f
info:    #38a4f8
warning: #f8b425
danger:  #ec4561
```

### Stat Card Variants
```css
.ic-card-head             /* icon bg: var(--primary-color) #28aaa9 */
.ic-card-head.secondary   /* icon bg: var(--secondary-color) #2b2d5d */
.ic-card-head.warning     /* icon bg: #f8b425 */
.ic-card-head.danger      /* icon bg: #ec4561 */
.ic-card-head.success     /* icon bg: #42ca7f */
.ic-card-head.info        /* icon bg: #38a4f8 */
```

Custom one-off icon colors used inline:
```
#42343a  Sale Returns
#5b5b25  Total Stock
#8a5f52  Product Category
#503570  Total Invoice
#70354c  Total Sale
#43ff00  Warehouse
#a2a1a1  Active Coupon
```

### Chart Colors
```css
/* Pie chart (monthly) */
["#FF6384","#63FF84","#6FE3D5","#5182FF","#56C876",
 "#2A73A8","#EEBF48","#6FE3C0","#28AAA9","#6FE3C0",
 "#3D96FF","#E36F6F"]

/* Sales line/bar chart */
borderColor: '#FF5733'

/* Pie legend */
.circle-this { background: #E36F6F }
.circle-last { background: #6FE388 }
```

---

## 4. Layout

### Page Structure
```
┌──────────────────────────────────────────────┐
│  .topbar  height:70px  position:fixed        │
│  ┌────────────────┐ .navbar-custom           │
│  │ .topbar-left   │ margin-left:240px        │
│  │ width:240px    │                          │
│  └────────────────┘                          │
├───────────────┬──────────────────────────────┤
│ .left.        │ .content-page                │
│ side-menu     │   margin-left: 240px         │
│ width:240px   │   .content                   │
│ top: 70px     │     padding: 0 15px 10px     │
│ fixed         │     margin-top: 70px         │
│               │     margin-bottom: 60px      │
└───────────────┴──────────────────────────────┤
│  .footer  position:absolute  left:240px      │
└──────────────────────────────────────────────┘
```

**Collapsed (.enlarged):** sidebar → 70px, all left margins → 70px

**Mobile (<=768px):** sidebar hidden, topbar-left → 70px, content margin-left: 0

### Card Spacing
```css
.card, .ic-card-head { margin-bottom: 24px }
.card .card-body     { padding: 24px }
```

### Custom Spacing Helpers
```css
.m-r-5   { margin-right: 5px }
.m-r-10  { margin-right: 10px }
.m-r-15  { margin-right: 15px }
.m-l-10  { margin-left: 10px }
.m-t-10  { margin-top: 10px }
.m-t-20  { margin-top: 20px }
.m-t-30  { margin-top: 30px }
.m-b-10  { margin-bottom: 10px }
.m-b-20  { margin-bottom: 20px }
.m-b-30  { margin-bottom: 30px }
```

---

## 5. Typography Scale

```css
/* Body */
font-size: 16px;  line-height: 1.7;

/* Named sizes */
.font-12 { font-size: 12px }
.font-14 { font-size: 14px }
.font-16 { font-size: 16px }
.font-18 { font-size: 18px }
.font-20 { font-size: 20px }
.font-24 { font-size: 24px }
.font-30 { font-size: 30px }

/* Named heading classes */
.page-title       { font-size:24px; font-weight:700; color:var(--primary-color) }
.page-sub-title   { font-size:20px; font-weight:700; color:var(--secondary-color) }
.ic-expance-heading { font-size:20px; line-height:20px }
  /* 1200-1440px: 16px */
.ic-earning-heading { font-size:28px; line-height:30px; color:var(--primary-color) }
  /* 1200-1440px: 20px */
.header-title     { font-size:20px; padding-bottom:20px }

/* Sidebar menu labels */
.menu-title {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #7b7ba9;
}

/* Sidebar links */
#sidebar-menu > ul > li > a {
  font-size: 16px;
  font-family: "Sarabun";
  color: #555582;
}
```

---

## 6. Buttons

```css
.btn { border-radius: 3px; font-size: 16px }
.btn-sm { font-size: 13.33px }
.btn-lg { font-size: 19.2px }

/* Solid variants */
.btn-primary   { bg:#28aaa9; border:#28aaa9; color:#fff }
.btn-secondary { bg:#2b2d5d; color:#fff }  hover: bg:#6063a5
.btn-secondary2{ bg:#6063a5; color:#fff }  hover: bg:#2b2d5d
.btn-success   { bg:#42ca7f; color:#fff }
.btn-info      { bg:#38a4f8; color:#fff }
.btn-warning   { bg:#f8b425; color:#fff }
.btn-danger    { bg:#ec4561; color:#fff }
.btn-dark      { bg:#2a3142; color:#fff }
.btn-muted     { bg:#F4F5FA }
.btn-pdf       { bg:#AD0B00; color:#fff }
.btn-excel     { bg:#236C45; color:#fff }

/* Outline variants */
.btn-outline-primary  { color:#28aaa9; border-color:#28aaa9 }
.btn-outline-success  { color:#42ca7f; border-color:#42ca7f }
.btn-outline-info     { color:#38a4f8; border-color:#38a4f8 }
.btn-outline-warning  { color:#f8b425; border-color:#f8b425 }
.btn-outline-danger   { color:#ec4561; border-color:#ec4561 }
.btn-outline-dark     { color:#2a3142; border-color:#2a3142 }

/* Focus ring */
.btn-primary:focus { box-shadow: 0 0 0 2px var(--primary-color) }
```

---

## 7. Cards

### Base Card
```css
.card {
  border: none;
  border-radius: 10px;
  box-shadow: 0px 0px 13px 0px rgba(236,236,241,0.44);
  margin-bottom: 24px;
}
.card .card-body { padding: 24px }
.ic-card-height-same { height: calc(100% - 24px) }
```

### Stat Card (`.ic-card-head`)
```css
.ic-card-head {
  padding: 30px;              /* <=1366px: 20px */
  background: #fff;
  box-shadow: 0px 0px 13px 0px rgba(236,236,241,0.44);
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
}

.ic-card-icon {
  font-size: 35px;            /* <=1500px: 25px */
  width: 80px; height: 80px; /* <=1500px: 70x70 */
  border-radius: 50%;
  line-height: 80px;
  text-align: center;
  color: #fff;
  background: var(--primary-color);
  display: inline-block;
}

.big-icon {                   /* watermark icon behind */
  font-size: 100px;
  color: rgba(36,105,92,0.03);
  position: absolute;
  left: -12px; top: -12px;
}

.ic-card-head h3 {            /* stat value */
  /* <=1500px: 24px  <=1366px: 18px */
}
.ic-card-head p {             /* label */
  color: #adb5bd;
  margin-bottom: 0;
  /* <=1500px: font-size: 12px */
}
```

**HTML pattern:**
```html
<a href="/url">
  <div class="ic-card-head {variant}">
    <i class="flaticon-conversation ic-card-icon"></i>
    <i class="flaticon-conversation big-icon"></i>
    <h3>08</h3>
    <p>Total Customer</p>
  </div>
</a>
```

**Variants:** (none), `.secondary`, `.warning`, `.danger`, `.success`, `.info`

---

## 8. Navigation

### Topbar
```css
.topbar        { position:fixed; top:0; left:0; right:0; z-index:999 }
.topbar-left   { background:#fff; height:70px; width:240px; float:left }
.navbar-custom {
  background:#fff; height:70px;
  margin-left:240px; padding:0 24px 0 0;
  box-shadow: 0px 5px 13px -8px rgba(0,0,0,0.05);
}
.navbar-custom .nav-link { padding:0 4px; line-height:70px; color:#525f80 }
```

### Sidebar
```css
.side-menu {
  width:240px; background:#fff;
  position:fixed; top:70px; bottom:0; z-index:10;
  padding-bottom:30px;
  box-shadow: 1px 0px 10px 0px rgba(0,0,0,0.05);
}

/* Items */
#sidebar-menu > ul > li > a {
  color:#555582; padding:12px 20px;
  font-size:16px; font-family:"Sarabun"; transition:all 0.5s;
}
#sidebar-menu > ul > li > a:hover { color:var(--primary-color) }

/* Active */
#sidebar-menu li.mm-active > a {
  background-color: var(--primary-color);
  color: #fff;
}

/* Submenu */
.submenu li a { padding:8px 20px 8px 50px; color:#555582 }
.submenu li a:hover {
  padding-left:60px;
  background:#f5f2ff;
  color:var(--primary-color);
}
.submenu li.mm-active > a { color:var(--primary-color) }
```

### Hamburger
```css
.ic-bar {
  width:30px; height:3px; border-radius:5px;
  background-color:var(--secondary-color);
}
.ic-bar:nth-child(2) { width:20px }  /* shortens at rest */
/* On hover: extends to 30px */
.ic-bar:not(:last-child) { margin-bottom:8px }
```

---

## 9. Forms

```css
.form-control {
  font-size:14px; height:40px;
  border-radius:0; padding:0.375rem 1rem;
}
.form-control:focus {
  border-color:var(--primary-color); box-shadow:none;
}
label { font-weight:500 }

/* Validation states */
.has-success .form-control { border-color:#42ca7f }
.has-warning .form-control { border-color:#f8b425 }
.has-error   .form-control { border-color:#ec4561 }
.error, .required          { color:#ec4561 }
```

### Select2
```css
#wrapper .select2-container--default .select2-selection--single {
  height:40px; border-radius:0; border:1px solid #ced4da;
}
.select2-results__option--highlighted { background:var(--primary-color) !important }
.select2-results__option[aria-selected=true] { background:var(--secondary-color) }
```

### Toggle Switch
```css
input[switch]:checked + label { background-color:var(--primary-color) }
/* Dimensions: 56x24px, border-radius:2rem */
```

---

## 10. Tables

```css
.table td, .table th {
  padding:15px 11px; white-space:nowrap; font-size:14px;
}
.table thead th { padding:10px 11px !important }

/* DataTable borders */
table.dataTable tbody td,
table.dataTable thead th { border:1px solid #eee }

/* Pagination */
.paginate_button.current {
  background:var(--secondary-color); color:#fff; border:none;
}
.paginate_button.current:hover { background:var(--primary-color) }

/* Search input */
.dataTables_wrapper input[type=search] {
  height:40px !important; border:1px solid #ddd !important;
}
```

---

## 11. Badges

```css
.badge         { padding:8px 10px; font-weight:500 }
.badge-primary { background:#28aaa9 }
.badge-success { background:#42ca7f }
.badge-info    { background:#38a4f8 }
.badge-warning { background:#f8b425; color:#fff }
.badge-danger  { background:#ec4561 }
.badge-dark    { background:#2a3142 }
```

---

## 12. Notifications

```css
/* Icon badge (red dot counter) */
.noti-icon-badge {
  position:absolute; top:12px; right:8px;
  width:18px; height:18px; line-height:18px;
  border-radius:50%; text-align:center;
  background:#ec4561; color:#fff;
}
.noti-icon { font-size:24px; color:#525f80 }

/* Notification items */
.notify-item   { padding:10px 20px; position:relative }
.notify-icon   { float:left; height:36px; width:36px; border-radius:50%; margin-right:10px }
.notify-details { font-weight:600; font-family:"Sarabun" }
.notify-details span { font-size:12px; font-weight:normal }

/* Icon background by type */
.notify-icon.success { background:rgba(68,202,128,0.192) }
.notify-icon.warning { background:rgba(248,181,37,0.192) }
.notify-icon.info    { background:rgba(56,165,248,0.192) }
.notify-icon.primary { background:rgba(40,170,170,0.192) }
.notify-icon.danger  { background:rgba(236,69,97,0.192) }

/* Badge inside row */
.ic-badge-base { position:absolute; top:10px; right:20px }
```

---

## 13. Dashboard-Specific Components

### Sales chart area
```css
.ic-expance-part { display:flex; align-items:center; justify-content:space-between }
.ic-earning-heading { color:var(--primary-color); font-size:28px }
.ic-max-height-same { height:calc(100% - 24px) }
```

### Top Products grid
```css
.product-slider-heads {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(170px,1fr));
  gap:24px;
}
/* <=1700px:140px  <=1366px:120px  <=1240px:108px */
/* <=1199px: 4 cols  <=800px: 3 cols  <=500px: 2 cols */

.ic-products-card img { max-height:150px; width:100%; object-fit:cover }
```

### Best Products list item
```css
.ic-best-products-images {
  height:90px; width:90px;
  display:flex; align-items:center; justify-content:center;
  margin-right:10px;
}
.ic-best-products-items .media {
  padding:5px; border:1px solid #f3f4f5; margin-top:6px;
}
.ic-best-products-items .media img { max-width:150px }
```

### Page title / breadcrumb
```css
.page-title-box { padding:15px 0 }
.breadcrumb { background:transparent; padding:4px 0 }
```

---

## 14. Footer

```css
.footer {
  position:absolute; bottom:0;
  left:240px; right:0;
  padding:19px 30px 20px;
  text-align:center;
  background:#e9e9ef;
  font-family:"Sarabun";
  color:var(--secondary-color);
}
/* <=575px: font-size:12px */
```

---

## 15. Preloader

```css
.ic-preloader {
  position:fixed; top:0; left:0;
  width:100%; height:100%; z-index:9999;
}
.ic-preloader::before {
  position:absolute; content:"";
  background:rgba(255,255,255,0.89); filter:blur(5px);
  width:100%; height:100%;
}
.db-spinner {
  width:75px; height:75px; border-radius:50%;
  border:4px solid var(--primary-color);
  border-top-color:transparent; border-bottom-color:transparent;
  animation:1s spin linear infinite;
}
/* <=575px: 50x50px */

@keyframes spin {
  from { transform:rotate(0deg) }
  to   { transform:rotate(360deg) }
}
```

---

## 16. Shadows & Borders

```css
/* Card / dropdown shadow */
box-shadow: 0px 0px 13px 0px rgba(236,236,241,0.44);

/* Sidebar shadow */
box-shadow: 1px 0px 10px 0px rgba(0,0,0,0.05);

/* Topbar shadow */
box-shadow: 0px 5px 13px -8px rgba(0,0,0,0.05);

/* Border colors */
inputs:    #ced4da
dividers:  #dee2e6 / #e9ecef
table:     #eee
card:      none (shadow only)
```

---

## 17. Icon Libraries

All icons are font-icon based (no SVG files needed).

| Library | Prefix | Example classes |
|---|---|---|
| Flaticon (custom) | `flaticon-` | `flaticon-dashboard`, `flaticon-conversation` |
| Material Design Icons | `mdi mdi-` | `mdi mdi-cart-outline`, `mdi mdi-percent` |
| Ionicons v4 | `ion ion-` | `ion ion-md-notifications` |
| Themify Icons | `ti-` | `ti-home`, `ti-settings` |
| Font Awesome 5 | `fas fa-` | `fas fa-chart-line`, `fas fa-align-justify` |

**Sidebar icon size:**
```css
#sidebar-menu ul li a i { font-size:20.7px; width:25px; display:inline-block }
```

**Custom Flaticon classes used:**
```
flaticon-conversation    customers, suppliers
flaticon-inventory       inventory-related
flaticon-new-product     products
flaticon-shopping-bag    sales
flaticon-shopping-bag-1  purchases
flaticon-expenses        expenses
flaticon-dashboard       dashboard
flaticon-pamphlet        catalogue
flaticon-bill            invoice
flaticon-report          reports
flaticon-working         administration
```

---

## 18. Animations & Transitions

```css
/* Links */
a { transition: all 0.3s ease-in-out }

/* Sidebar items */
#sidebar-menu > ul > li > a { transition: all 0.5s }

/* Submenu indent on hover */
.submenu > li > a { padding-left:50px }
.submenu > li > a:hover { padding-left:60px }

/* Preloader */
animation: 1s spin linear infinite

/* Bell icon */
animation: tada 1.5s ease infinite
```

---

## 19. Responsive Breakpoints

Bootstrap 4 standard: xs=0, sm=576, md=768, lg=992, xl=1200

Custom thresholds in this design:
```
<=480px   sidebar full-screen, navbar margin:0
<=575px   footer font-size:12px; login form full width
<=767px   sidebar hidden; content full-width
<=768px   topbar-left → 70px; sidebar collapsed
<=991px   various layout stack changes
<=1199px  product grid 4 cols; dashboard chart stacks
<=1366px  card padding 20px; card-icon 70px
<=1440px  ic-expance-heading 16px; piechart ul block
<=1500px  ic-earning-heading 20px; card-icon 70px
<=1600px  intlTelInput width:300px
```

---

## 20. Login Page

```css
.ic_main_form_area {
  display:flex; justify-content:center;
  min-height:100vh;
  background-size:cover; background-position:center;
}
.ic_main_form_area::before {
  content:""; position:absolute;
  background:rgba(0,0,0,0.4); /* dark overlay */
  width:100%; height:100%;
}
.ic_main_form_inner {
  background:#fff;
  box-shadow: 2px 3.464px 14.72px 1.28px rgba(16,16,16,0.15);
  padding:60px 20px; width:400px;
}
/* <=480px: width:100% */

/* Inputs */
.login_form .form-group input {
  font-family:"Karla"; height:50px;
  background:#f5f5f5; border-color:#efefef;
  border-radius:0; padding:0 15px 0 50px;
}

/* Submit button */
.submit_btn {
  background:var(--primary-color); color:#fff;
  text-transform:uppercase; height:50px; width:100%;
  border:none; border-radius:0;
  /* hover: slides in #00033E from center via pseudo-element */
}
```

---

## 21. Modals

Bootstrap 4 `.modal.fade`:
```html
<div class="modal fade" id="myModal">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">...</div>
      <div class="modal-body">...</div>
      <div class="modal-footer">
        <button class="btn btn-danger" data-dismiss="modal">Close</button>
        <button class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</div>
```

Sizes used: default (500px), `.modal-lg` (800px)

---

## 22. Pagination

```css
.progress { height:10px }
.progress-bar { background:var(--primary-color) }

.pagination .page-link { color:var(--primary-color) }
.page-item.active .page-link {
  background:var(--primary-color);
  border-color:var(--primary-color);
}
```

---

## 23. Tabs

```css
.ic-customer-details-tab .nav-link {
  border:none;
  border-bottom:3px solid transparent !important;
  color:var(--primary-color); font-weight:600;
}
.ic-customer-details-tab .nav-link.active {
  border-bottom:3px solid var(--primary-color) !important;
}
```

---

## 24. Utility Classes

```css
.ic-main-color      { color:var(--primary-color) !important }
.ic-logo-height     { max-height:50px; max-width:120px }
.ic-pos-button-header { font-size:14px }

/* Sizing */
.img-32     { width:32px !important; height:32px !important }
.img-40     { width:40px !important; height:40px !important }
.img-64     { width:64px !important; height:64px !important }
.img-100-60 { width:100px !important; height:60px !important }
.default-image-size { width:80px !important; height:80px !important; object-fit:contain }
.barcode-max-height { max-height:100px !important }
.max-width-50p      { max-width:50% !important }
.width_10p          { width:10% !important }
.input-sm { height:30px; padding:5px 10px; font-size:12px; border-radius:3px }

/* Right-align (flips to left on <=991px) */
.ic-right-content   { text-align:right }
.ic-print-btn-head  { text-align:right }
```

---

## 25. Implementation Checklist for AI

To build a page matching this design:

1. Include Bootstrap 4.6 + MetisMenu + Select2 + DataTables
2. Set `:root { --primary-color:#28aaa9; --secondary-color:#2b2d5d }`
3. Load Roboto + Sarabun + Karla from Google Fonts
4. Wrapper: `#wrapper` → `.topbar` (fixed 70px) + `.left.side-menu` (fixed 240px) + `.content-page` (margin-left:240px)
5. Cards: no border, box-shadow `0px 0px 13px 0px rgba(236,236,241,0.44)`, border-radius:10px
6. Buttons: `.btn-primary` themed to `#28aaa9`, border-radius:3px
7. Stat cards: `.ic-card-head` + variant + `.ic-card-icon` (circle) + `.big-icon` (watermark)
8. Inputs: border-radius:0, height:40px, focus border `var(--primary-color)` no shadow
9. Tables: DataTables with `#eee` cell borders, pagination uses `--secondary-color` for current
10. Icons: Flaticon for sidebar, MDI/Ionicons/FA for UI elements — all font-based
