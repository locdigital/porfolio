# Handoff: van de DNS/cPanel lien quan `loc.digital`

Ngay 2026-06-18, user dang debug viec tro subdomain `cms` ve hosting cPanel. Can agent khac tiep tuc ho tro kiem tra DNS, domain dung, cPanel domain mapping, va document root.

## Muc tieu

User muon co mot subdomain cho CMS/admin, du kien la:

```txt
cms.phucloc.digital
```

hoac user dang nham lan voi:

```txt
cms.loc.digital
```

Can xac dinh ro domain nao moi la domain dung can dung cho CMS.

## Thong tin tu cPanel

Trong cPanel, muc General Information hien:

```txt
Primary Domain: phucloc.digital
Shared IP Address: 137.59.105.59
Home Directory: /home/dek1oxl3p4qr
Current User: dek1oxl3p4qr
SSL Certificate: Active
```

Vay IP hosting/cPanel can tro A record ve la:

```txt
137.59.105.59
```

## Tinh trang trong cPanel Domains

Trang cPanel Domains dang co 4 domain:

```txt
cms.loc.digital
index.vietsmiletravel.vn
phucloc.digital
tuyensinh.coachbientruong.com
```

Trong do:

```txt
phucloc.digital
Document Root: /public_html
Redirects To: https://loc.digital/
Force HTTPS Redirect: On
```

Va:

```txt
cms.loc.digital
Document Root: /cms.loc.digital
Redirects To: Not Redirected
```

Dieu dang nghi ngo:

- User muon tao subdomain cho `phucloc.digital`, nhung trong cPanel lai dang co `cms.loc.digital`.
- `phucloc.digital` hien dang redirect sang `https://loc.digital/`, nen co the user/hosting dang cau hinh domain bi lan giua `phucloc.digital` va `loc.digital`.
- Neu muon CMS la subdomain cua `phucloc.digital`, can tao domain/subdomain trong cPanel la `cms.phucloc.digital`, khong phai `cms.loc.digital`.

## Tinh trang DNS user da tao

User da tao record trong DNS UI co dang:

```txt
Host: cms
Suffix hien tren UI: .loc.digital
Type: A
Value: 137.59.105.59
TTL: 30 phut
```

Record nay tuong ung:

```txt
cms.loc.digital -> 137.59.105.59
```

Neu DNS UI dang quan ly zone `loc.digital`, thi record tren la dung cho `cms.loc.digital`.

Neu user muon `cms.phucloc.digital`, thi record nay sai zone. Can vao DNS zone cua `phucloc.digital` va tao:

```txt
Host: cms
Type: A
Value: 137.59.105.59
TTL: 30 phut hoac Auto
```

Ket qua mong muon:

```txt
cms.phucloc.digital -> 137.59.105.59
```

## Lenh user da test

User da chay:

```bash
ping cms.loc.digital
```

Ket qua:

```txt
ping: cannot resolve cms.loc.digital: Unknown host
```

User cung da chay:

```bash
dig cms.loc.digital
```

Ket qua quan trong:

```txt
status: NXDOMAIN
ANSWER: 0
QUESTION SECTION:
cms.loc.digital. IN A
```

NXDOMAIN nghia la DNS tai thoi diem test khong tim thay record `cms.loc.digital`.

## Cac kha nang gay loi

1. User dang test sai domain.

   Neu muc tieu that su la `cms.phucloc.digital`, thi viec ping `cms.loc.digital` se khong tra loi du la `cms.phucloc.digital` da dung.

2. DNS record duoc tao o sai DNS provider/zone.

   Trong UI user thay hau to `.loc.digital`, nen record dang thuoc `loc.digital`. Neu nameserver active cua `loc.digital` khong phai provider nay, record se khong co tac dung.

3. Record moi tao chua propagate.

   TTL dang de 30 phut. Thuong mat vai phut den 30 phut. Neu moi doi nameserver thi co the 24-48 gio.

4. cPanel domain mapping va DNS khong cung ten.

   cPanel co `cms.loc.digital`, DNS cung dang tao `cms.loc.digital`, nhung user lai noi primary domain la `phucloc.digital`. Can hoi/xac minh user muon CMS nam o ten mien nao.

5. Domain `phucloc.digital` dang redirect sang `https://loc.digital/`.

   Neu user khong chu y, truy cap `phucloc.digital` co the bi day sang `loc.digital`. Can kiem tra redirect trong cPanel Manage cua `phucloc.digital`.

6. Chua tao dung document root cho CMS.

   Hien `cms.loc.digital` map vao:

   ```txt
   /home/dek1oxl3p4qr/cms.loc.digital
   ```

   Nhung trong codebase user co file:

   ```txt
   public/admin/index.html
   ```

   Neu CMS/admin static file nam trong `public/admin`, can can nhac document root tren hosting phai tro dung folder build/deploy thuc te, khong mac dinh la `/cms.loc.digital` neu folder do khong co file.

## Viec agent tiep theo nen lam

1. Xac nhan user muon dung domain nao:

   ```txt
   cms.loc.digital
   ```

   hay:

   ```txt
   cms.phucloc.digital
   ```

2. Kiem tra DNS authoritative nameserver cho tung domain:

   ```bash
   dig NS loc.digital
   dig NS phucloc.digital
   ```

3. Kiem tra A record:

   ```bash
   dig cms.loc.digital A
   dig cms.phucloc.digital A
   ```

4. Neu muon bypass cache local, test voi public resolver:

   ```bash
   dig @1.1.1.1 cms.loc.digital A
   dig @8.8.8.8 cms.loc.digital A
   dig @1.1.1.1 cms.phucloc.digital A
   dig @8.8.8.8 cms.phucloc.digital A
   ```

5. Trong cPanel, tao/sua domain cho khop DNS:

   Neu dung `cms.phucloc.digital`:

   ```txt
   cPanel Domains -> Create A New Domain -> cms.phucloc.digital
   Document Root: folder chua site CMS/admin
   ```

   Neu dung `cms.loc.digital`:

   ```txt
   Dam bao DNS zone active cua loc.digital co A record cms -> 137.59.105.59
   Dam bao cPanel domain cms.loc.digital document root co file web
   ```

6. Sau khi DNS tra ve IP, kiem tra HTTP/HTTPS:

   ```bash
   curl -I http://cms.loc.digital
   curl -I https://cms.loc.digital
   curl -I http://cms.phucloc.digital
   curl -I https://cms.phucloc.digital
   ```

## Ket luan tam thoi

IP host khong sai. IP hosting tu cPanel la:

```txt
137.59.105.59
```

Van de chinh hien tai co ve la nham lan giua:

```txt
loc.digital
```

va:

```txt
phucloc.digital
```

Can dong bo 3 cho sau ve cung mot hostname:

```txt
DNS record
cPanel Domains/subdomain
URL user test bang ping/dig/browser
```

Neu user muon CMS la `cms.phucloc.digital`, thi hien tai cPanel/DNS dang tao theo `cms.loc.digital` la sai huong. Neu user muon CMS la `cms.loc.digital`, thi can kiem tra nameserver cua `loc.digital` va vi sao `dig cms.loc.digital` van NXDOMAIN.
