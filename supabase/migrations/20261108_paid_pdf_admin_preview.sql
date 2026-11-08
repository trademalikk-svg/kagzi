-- Allow verified KAGZI library admins to preview/download private paid PDFs.
drop policy if exists "KAGZI admins preview paid PDFs" on storage.objects;
create policy "KAGZI admins preview paid PDFs" on storage.objects
for select to authenticated
using (
  bucket_id='kagzi-paid-pdfs'
  and exists (
    select 1 from public.kagzi_library_admins a
    where a.user_id=(select auth.uid())
  )
);
