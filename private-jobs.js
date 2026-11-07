import { supabase } from './kagzi-supabase.js';

const $ = (id) => document.getElementById(id);
const filters = ['jobSearch','regionFilter','experienceFilter','qualificationFilter','salaryFilter'];
let allJobs = [];

const money = (value, period='') => {
  if (value === null || value === undefined || value === '') return '';
  const amount = new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(value));
  return amount + (period === 'monthly' ? ' / month' : period === 'annual' ? ' / year' : period === 'stipend' ? ' / month stipend' : '');
};
const safeHttpsUrl = (value) => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; }
  catch { return null; }
};
const salaryMonthlyEquivalent = (job) => {
  if (job.salary_period === 'monthly') return job.salary_min_inr ?? job.salary_max_inr ?? null;
  if (job.salary_period === 'annual') { const annual = job.salary_min_inr ?? job.salary_max_inr; return annual == null ? null : Math.round(annual / 12); }
  if (job.salary_period === 'stipend') return job.salary_min_inr ?? job.salary_max_inr ?? null;
  return null;
};
const salaryLabel = (job) => {
  if (job.salary_disclosure === 'not_disclosed') return 'Not Disclosed';
  if (job.salary_disclosure === 'estimated') return 'Estimated';
  return 'Official';
};
const formatRange = (min,max,period) => {
  if (min == null && max == null) return 'Not disclosed';
  if (min != null && max != null) return money(min,period) + ' – ' + money(max,period);
  return money(min ?? max,period);
};
function createMeta(label,value){
  const div=document.createElement('div');div.className='meta-item';
  const small=document.createElement('small');small.textContent=label;
  const b=document.createElement('b');b.textContent=value || 'Not specified';
  div.append(small,b);return div;
}
function createJobCard(job){
  const card=document.createElement('article');card.className='job-card';
  const top=document.createElement('div');top.className='job-top';
  const heading=document.createElement('div');
  const company=document.createElement('div');company.className='company';company.textContent=job.company_name;
  const title=document.createElement('h3');title.textContent=job.job_title;
  heading.append(company,title);
  const expired=job.verification_status==='expired' || (job.last_date && job.last_date < new Date().toISOString().slice(0,10));
  const status=document.createElement('span');status.className='pill'+(expired?' expired':'');status.textContent=expired?'Expired':'Verified';
  top.append(heading,status);card.append(top);
  if(job.summary){const summary=document.createElement('p');summary.className='job-summary';summary.textContent=job.summary;card.append(summary);}
  const meta=document.createElement('div');meta.className='job-meta';
  meta.append(
    createMeta('Qualification / योग्यता',job.qualification),
    createMeta('Experience / अनुभव',job.experience_level==='fresher'?'Fresher':job.experience_level==='experienced'?'Experienced':job.experience_level==='internship'?'Internship':'Both'),
    createMeta('Location / स्थान',job.location),
    createMeta('Last date / अंतिम तारीख',job.last_date || 'Not specified'),
    createMeta('Job type',String(job.employment_type||'full_time').replaceAll('_',' ')),
    createMeta('Minimum age',job.minimum_age ? job.minimum_age+' years' : 'See official notice')
  );card.append(meta);
  const salary=document.createElement('section');salary.className='salary-panel';
  const salaryTitle=document.createElement('div');salaryTitle.className='salary-title';
  const titleText=document.createElement('span');titleText.textContent='Salary & Income / वेतन';
  const disclosure=document.createElement('span');disclosure.className='pill '+(job.salary_disclosure==='official'?'official':job.salary_disclosure==='estimated'?'estimated':'');disclosure.textContent=salaryLabel(job);
  salaryTitle.append(titleText,disclosure);salary.append(salaryTitle);
  const values=document.createElement('div');values.className='salary-values';
  const monthly=document.createElement('span');monthly.textContent='Monthly Salary / Internship Stipend: ';const monthlyB=document.createElement('b');monthlyB.textContent=job.salary_period==='monthly'||job.salary_period==='stipend'?formatRange(job.salary_min_inr,job.salary_max_inr,job.salary_period):'Not specified';monthly.append(monthlyB);
  const ctc=document.createElement('span');ctc.textContent='Annual CTC: ';const ctcB=document.createElement('b');ctcB.textContent=formatRange(job.annual_ctc_min_inr,job.annual_ctc_max_inr,'annual');ctc.append(ctcB);
  const inhand=document.createElement('span');inhand.textContent='In-hand: ';const inhandB=document.createElement('b');inhandB.textContent=formatRange(job.in_hand_min_inr,job.in_hand_max_inr,'monthly');inhand.append(inhandB);
  values.append(monthly,ctc,inhand);salary.append(values);
  const salaryNote=document.createElement('p');salaryNote.className='salary-note';salaryNote.textContent=job.salary_note || (job.salary_disclosure==='estimated'?'Estimated amount; confirm with the employer.':job.salary_disclosure==='not_disclosed'?'Company has not disclosed salary in the checked source.':'Official salary information from the source link.');salary.append(salaryNote);
  card.append(salary);
  const bottom=document.createElement('div');bottom.className='job-bottom';
  const source=document.createElement('span');source.className='source-info';source.textContent='Source: '+job.source_name+' · Checked: '+(job.source_checked_at?new Date(job.source_checked_at).toLocaleDateString('en-IN'):'Not recorded');
  const url=safeHttpsUrl(job.application_url);
  if(url && !expired){const apply=document.createElement('a');apply.className='apply';apply.href=url;apply.target='_blank';apply.rel='noopener noreferrer';apply.textContent='Official Apply ↗';bottom.append(source,apply);}
  else {const unavailable=document.createElement('span');unavailable.className='pill expired';unavailable.textContent=expired?'Applications may be closed':'Apply link unavailable';bottom.append(source,unavailable);}
  card.append(bottom);return card;
}
function matchesSalary(job,filter){
  if(filter==='all')return true;
  const monthly=salaryMonthlyEquivalent(job);if(monthly==null)return false;
  if(filter==='under20')return monthly<20000;
  if(filter==='20to30')return monthly>=20000&&monthly<30000;
  if(filter==='30to50')return monthly>=30000&&monthly<50000;
  if(filter==='50plus')return monthly>=50000;
  return true;
}
function render(){
  const query=$('jobSearch').value.trim().toLocaleLowerCase();
  const region=$('regionFilter').value,experience=$('experienceFilter').value,qualification=$('qualificationFilter').value,salary=$('salaryFilter').value;
  const filtered=allJobs.filter(job=>{
    const text=[job.company_name,job.job_title,job.summary,job.location,job.qualification,job.category].join(' ').toLocaleLowerCase();
    const regionOk=region==='all'||job.region===region||(region==='all_india'&&job.region==='all_india');
    const expOk=experience==='all'||job.experience_level===experience||job.experience_level==='both';
    const qualificationOk=qualification==='all'||job.qualification.toLocaleLowerCase().includes(qualification);
    const active=!(job.verification_status==='expired'||(job.last_date&&job.last_date<new Date().toISOString().slice(0,10)));
    return active&&(!query||text.includes(query))&&regionOk&&expOk&&qualificationOk&&matchesSalary(job,salary);
  });
  const list=$('jobsList');list.replaceChildren();
  $('resultCount').textContent=filtered.length+' job(s) found';
  if(!filtered.length){const empty=document.createElement('div');empty.className='state-card';empty.textContent='अभी इन filters के अनुसार कोई verified active job उपलब्ध नहीं है। बाद में फिर देखें।';list.append(empty);return;}
  for(const job of filtered)list.append(createJobCard(job));
}
async function loadJobs(){
  const list=$('jobsList');list.replaceChildren();
  const loading=document.createElement('div');loading.className='state-card';loading.textContent='नौकरियों की जानकारी लोड हो रही है…';list.append(loading);
  try{
    const {data,error}=await supabase.from('kagzi_private_jobs')
      .select('id,company_name,job_title,summary,region,location,qualification,experience_level,category,employment_type,minimum_age,salary_min_inr,salary_max_inr,salary_period,annual_ctc_min_inr,annual_ctc_max_inr,in_hand_min_inr,in_hand_max_inr,salary_disclosure,salary_note,salary_source_url,application_url,source_name,source_url,source_checked_at,verification_status,last_date,published_at')
      .eq('is_published',true).in('verification_status',['verified','expired']).order('published_at',{ascending:false});
    if(error)throw error;
    allJobs=data||[];render();
  }catch(error){
    list.replaceChildren();const state=document.createElement('div');state.className='state-card';state.textContent='Jobs अभी लोड नहीं हो सकीं। कृपया थोड़ी देर बाद फिर कोशिश करें।';list.append(state);
    $('resultCount').textContent='Data unavailable';
    console.error('Private Jobs load failed:',error.message);
  }
}
for(const id of filters)$(id).addEventListener(id==='jobSearch'?'input':'change',render);
$('clearFilters').addEventListener('click',()=>{for(const id of filters)$(id).value=id==='regionFilter'?'all': 'all';$('jobSearch').value='';render();});
loadJobs();

async function loadCompanySources(){
 const container=$('companySources');if(!container)return;
 try{
  const [sourceResponse,profileResponse]=await Promise.all([
   fetch('./private-job-sources.json',{cache:'no-cache'}),
   fetch('./private-company-profiles.json',{cache:'no-cache'})
  ]);
  if(!sourceResponse.ok||!profileResponse.ok)throw new Error('Company details unavailable');
  const [sources,profiles]=await Promise.all([sourceResponse.json(),profileResponse.json()]);
  container.replaceChildren();
  for(const source of sources){
   let url;try{url=new URL(source.url)}catch{continue}
   if(url.protocol!=='https:')continue;
   const profile=profiles[source.sector];
   const card=document.createElement('article');card.className='company-profile-card';
   const head=document.createElement('div');head.className='company-profile-head';
   const name=document.createElement('b');name.textContent=source.company;
   const sector=document.createElement('small');sector.textContent=source.sector;
   head.append(name,sector);card.append(head);
   if(profile){
    const about=document.createElement('p');about.className='company-about';about.textContent=profile.about;card.append(about);
    const details=document.createElement('details');details.className='company-details';
    const summary=document.createElement('summary');summary.textContent='Eligibility & Details / योग्यता देखें';details.append(summary);
    const content=document.createElement('div');content.className='company-profile-content';
    const addList=(heading,items)=>{
     const section=document.createElement('section');
     const h=document.createElement('h4');h.textContent=heading;section.append(h);
     const ul=document.createElement('ul');
     for(const item of items||[]){const li=document.createElement('li');li.textContent=item;ul.append(li);}
     section.append(ul);content.append(section);
    };
    const addText=(heading,value)=>{
     const section=document.createElement('section');
     const h=document.createElement('h4');h.textContent=heading;const para=document.createElement('p');para.textContent=value||'See official vacancy notice.';
     section.append(h,para);content.append(section);
    };
    addList('Hiring Areas / भर्ती विभाग',profile.hiring_areas);
    addList('Qualification Guide / सामान्य योग्यता',profile.qualification_guide);
    addText('Experience / अनुभव',profile.experience_guide);
    addText('Fresher Opportunities / फ्रेशर',profile.fresher_note);
    addText('Important Role Notes / जरूरी जानकारी',profile.role_specific_note);
    const notice=document.createElement('p');notice.className='company-eligibility-warning';
    notice.textContent='ध्यान दें: यह सामान्य जानकारी है, भर्ती की guarantee या fixed eligibility नहीं। Age, marks, branch, passing year, experience और documents हर post के official notice से मिलाएँ।';
    content.append(notice);details.append(content);card.append(details);
   }
   const link=document.createElement('a');link.className='company-official-link';link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Official Careers & Apply ↗';
   card.append(link);container.append(card);
  }
  if(!container.children.length)throw new Error('No valid company links');
  container.removeAttribute("aria-busy");
 }catch(error){
  container.replaceChildren();const state=document.createElement('div');state.className='state-card';state.textContent='Company eligibility details अभी लोड नहीं हो सके।';container.append(state);
  container.removeAttribute("aria-busy");
  console.error('Company career directory failed:',error.message);
 }
}
loadCompanySources();
