function applyTheme(theme){document.body.classList.toggle('dark',theme==='dark');document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.textContent=theme==='dark'?'Light':'Dark')}
function toggleTheme(){const next=document.body.classList.contains('dark')?'light':'dark';localStorage.setItem('samJournalTheme',next);applyTheme(next)}
function storageKey(slug,name){return `ashishJournal:${slug}:${name}`}
function getSlug(){return document.body.dataset.articleSlug||''}
function readNumber(slug,name){return +(localStorage.getItem(storageKey(slug,name))||0)}
function writeNumber(slug,name,value){localStorage.setItem(storageKey(slug,name),String(Math.max(0,value)))}
function updateEngagement(slug){if(!slug)return;const liked=localStorage.getItem(storageKey(slug,'liked'))==='yes';document.querySelectorAll('[data-like-count]').forEach(n=>n.textContent=readNumber(slug,'likes'));document.querySelectorAll('[data-share-count]').forEach(n=>n.textContent=readNumber(slug,'shares'));document.querySelectorAll('[data-like-button]').forEach(b=>b.textContent=liked?'Liked':'Like');renderComments(slug)}
function toggleLike(){const slug=getSlug();if(!slug)return;const key=storageKey(slug,'liked');const liked=localStorage.getItem(key)==='yes';localStorage.setItem(key,liked?'no':'yes');writeNumber(slug,'likes',readNumber(slug,'likes')+(liked?-1:1));updateEngagement(slug)}
function trackShare(){const slug=getSlug();if(!slug)return;const key=storageKey(slug,'shared');const shared=localStorage.getItem(key)==='yes';if(!shared){localStorage.setItem(key,'yes');writeNumber(slug,'shares',readNumber(slug,'shares')+1);updateEngagement(slug)}}
function readComments(slug){try{return JSON.parse(localStorage.getItem(storageKey(slug,'comments'))||'[]')}catch{return[]}}
function writeComments(slug,comments){localStorage.setItem(storageKey(slug,'comments'),JSON.stringify(comments))}

function isAdmin(){
  return localStorage.getItem('ashishJournalAdmin') === 'yes';
}

function handleAdminToggle(){
  if(isAdmin()){
    localStorage.setItem('ashishJournalAdmin', 'no');
    alert('Admin Mode deactivated.');
    location.reload();
  } else {
    const pass = prompt('Enter admin passcode to enable editing options:');
    if(pass === 'ashish'){
      localStorage.setItem('ashishJournalAdmin', 'yes');
      alert('Admin Mode activated successfully.');
      location.reload();
    } else {
      alert('Incorrect passcode.');
    }
  }
}

function renderComments(slug){
  const comments=readComments(slug);
  document.querySelectorAll('[data-comment-count]').forEach(n=>n.textContent=comments.length);
  const list=document.querySelector('[data-comment-list]');
  if(!list)return;
  list.replaceChildren();
  if(!comments.length){
    const empty=document.createElement('p');
    empty.className='meta';
    empty.textContent='No comments yet. Add the first note for this article.';
    list.appendChild(empty);
    return;
  }
  comments.forEach((c, idx)=>{
    const item=document.createElement('div');
    item.className='comment-item';
    item.style.position = 'relative';
    const name=document.createElement('strong');
    name.textContent=c.name||'Reader';
    const time=document.createElement('time');
    time.textContent=c.date;
    const text=document.createElement('p');
    text.textContent=c.text;
    item.append(name,time,text);
    
    if (isAdmin()) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.style.position = 'absolute';
      delBtn.style.top = '14px';
      delBtn.style.right = '14px';
      delBtn.style.border = '0';
      delBtn.style.background = 'transparent';
      delBtn.style.color = '#be123c';
      delBtn.style.fontSize = '12px';
      delBtn.style.fontWeight = '800';
      delBtn.style.cursor = 'pointer';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        if (confirm('Delete this comment?')) {
          const comments = readComments(slug);
          comments.splice(idx, 1);
          writeComments(slug, comments);
          renderComments(slug);
        }
      });
      item.appendChild(delBtn);
    }
    
    list.appendChild(item);
  });
}

function addComment(event){event.preventDefault();const slug=getSlug();const form=event.currentTarget;const name=form.querySelector('[name="name"]').value.trim()||'Reader';const text=form.querySelector('[name="comment"]').value.trim();if(!text)return;const comments=readComments(slug);comments.unshift({name,text,date:new Date().toLocaleString([], {dateStyle:'medium', timeStyle:'short'})});writeComments(slug,comments);form.reset();updateEngagement(slug)}
function handleSiteSearch(event){event.preventDefault();const input=event.currentTarget.querySelector('input');const q=(input?.value||'').trim();if(location.pathname.endsWith('index.html')||location.pathname==='/'||location.pathname.endsWith('/sam-blog-site/')){filterArticles(q)}else{location.href=`../index.html${q?'?q='+encodeURIComponent(q):'#articles'}`}}
function filterArticles(query){const q=(query||'').toLowerCase();document.querySelectorAll('[data-article-card]').forEach(card=>{card.classList.toggle('is-hidden',!!q&&!card.innerText.toLowerCase().includes(q))});const input=document.querySelector('[data-article-search]');if(input)input.value=query||''}
function copyText(btn){const code=btn.parentElement.querySelector('code').innerText;navigator.clipboard.writeText(code);btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy',900)}
function copyAnswer(btn){const d=btn.closest('details');navigator.clipboard.writeText(d.querySelector('summary').innerText+'\n'+d.querySelector('p').innerText);btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy answer',900)}
function printSection(id){window.print()}
function copyLink(){navigator.clipboard.writeText(location.href);trackShare();const ev=typeof event!=='undefined'?event:null;const targetBtn=(ev?.target&&ev.target.tagName==='BUTTON')?ev.target:null;const b=targetBtn||document.querySelector('[data-copy-link]');if(b){const old=b.textContent;b.textContent='Copied';setTimeout(()=>b.textContent=old,900)}}
function calcIBM(){const s=+document.getElementById('ibmSockets')?.value||0,c=+document.getElementById('ibmCores')?.value||0,p=+document.getElementById('ibmPvu')?.value||0,v=+document.getElementById('ibmVcpu')?.value||0;const o=document.getElementById('ibmCalcOut');if(o)o.textContent=`Full capacity: ${s*c*p} PVU | Sub-capacity: ${v*p} PVU`}
function calcOracle(){const c=+document.getElementById('orclCores')?.value||0,f=+document.getElementById('orclFactor')?.value||0;const o=document.getElementById('orclCalcOut');if(o)o.textContent=`Required: ${Math.ceil(c*f)} Processor licenses`}

function renderDynamicArticles(){
  const grid = document.querySelector('.article-grid');
  if(!grid) return;
  
  const deleted = JSON.parse(localStorage.getItem('ashishJournal:deletedArticles') || '[]');
  
  document.querySelectorAll('[data-article-card]').forEach(card => {
    const href = card.getAttribute('href') || '';
    const slug = href.split('/').pop().replace('.html', '');
    if(deleted.includes(slug)){
      card.remove();
    } else if (isAdmin()) {
      injectDeleteBtn(card, slug, false);
    }
  });
  
  const dynamics = JSON.parse(localStorage.getItem('ashishJournal:dynamicArticles') || '[]');
  dynamics.forEach(art => {
    if (deleted.includes(art.slug)) return;
    
    const card = document.createElement('a');
    card.className = 'article-card';
    card.setAttribute('data-article-card', '');
    
    // Resolve dynamic path relative to page directory
    const prefix = (location.pathname.includes('/articles/')) ? '' : 'articles/';
    card.setAttribute('href', `${prefix}viewer.html?slug=${art.slug}`);
    
    card.innerHTML = `
      <span class="cat">${art.category}</span>
      <h2>${art.title}</h2>
      <p>${art.description}</p>
      <div class="meta">By ${art.author || 'Ashish Deshmukh'} on ${art.date}</div>
    `;
    
    if (isAdmin()) {
      injectDeleteBtn(card, art.slug, true);
    }
    
    grid.insertBefore(card, grid.firstChild);
  });
}

function injectDeleteBtn(card, slug, isDynamic){
  card.style.position = 'relative';
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.style.position = 'absolute';
  delBtn.style.top = '10px';
  delBtn.style.right = '10px';
  delBtn.style.border = '1px solid #be123c';
  delBtn.style.borderRadius = '999px';
  delBtn.style.padding = '4px 10px';
  delBtn.style.background = '#be123c';
  delBtn.style.color = '#fff';
  delBtn.style.fontSize = '11px';
  delBtn.style.fontWeight = '900';
  delBtn.style.cursor = 'pointer';
  delBtn.style.zIndex = '10';
  delBtn.textContent = 'Delete';
  delBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this article from the UI?')){
      if(isDynamic){
        const dynamics = JSON.parse(localStorage.getItem('ashishJournal:dynamicArticles') || '[]');
        const filtered = dynamics.filter(a => a.slug !== slug);
        localStorage.setItem('ashishJournal:dynamicArticles', JSON.stringify(filtered));
      } else {
        const deleted = JSON.parse(localStorage.getItem('ashishJournal:deletedArticles') || '[]');
        deleted.push(slug);
        localStorage.setItem('ashishJournal:deletedArticles', JSON.stringify(deleted));
      }
      alert('Article deleted from UI.');
      location.reload();
    }
  });
  card.appendChild(delBtn);
}

function showAddArticleModal(){
  const modalId = 'addArticleModal';
  if(document.getElementById(modalId)) return;
  
  const modal = document.createElement('div');
  modal.id = modalId;
  modal.style.position = 'fixed';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.background = 'rgba(0, 0, 0, 0.6)';
  modal.style.backdropFilter = 'blur(6px)';
  modal.style.zIndex = '1000';
  modal.style.display = 'grid';
  modal.style.placeItems = 'center';
  modal.style.padding = '20px';
  
  modal.innerHTML = `
    <div class="calc-card" style="width: 100%; max-width: 600px; background: var(--paper); border: 1px solid var(--line); box-shadow: var(--shadow); max-height: calc(100vh - 40px); overflow: auto; border-radius:14px; padding:22px">
      <h2 style="margin-top:0; font-size:24px">Add New Article</h2>
      <form id="addArticleForm" style="display:grid; gap:12px">
        <label style="font-weight:700; font-size:13px">Title<br><input name="title" required placeholder="e.g. Oracle Database Performance Tuning" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:6px; background:var(--card); color:var(--ink); font-family:inherit"></label>
        <label style="font-weight:700; font-size:13px">Category / Topic<br><input name="category" required placeholder="e.g. Oracle Licensing" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:6px; background:var(--card); color:var(--ink); font-family:inherit"></label>
        <label style="font-weight:700; font-size:13px">Summary / Deck<br><textarea name="description" required placeholder="e.g. A field guide to database tuning..." style="width:100%; padding:8px; border:1px solid var(--line); border-radius:6px; background:var(--card); color:var(--ink); height:60px; font-family:inherit"></textarea></label>
        <label style="font-weight:700; font-size:13px">Content (HTML Paragraphs & Sections)<br><textarea name="content" required placeholder="Enter HTML content tags (e.g. &lt;section id='x' class='portal-section' data-section-title='...'&gt;&lt;h2&gt;...&lt;/h2&gt;&lt;p&gt;...&lt;/p&gt;&lt;/section&gt;)" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:6px; background:var(--card); color:var(--ink); height:160px; font-family:inherit"></textarea></label>
        <div style="display:flex; gap:10px">
          <label style="flex:1; font-weight:700; font-size:13px">Author<br><input name="author" value="Ashish Deshmukh" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:6px; background:var(--card); color:var(--ink); font-family:inherit"></label>
          <label style="flex:1; font-weight:700; font-size:13px">Date<br><input name="date" value="${new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}" style="width:100%; padding:8px; border:1px solid var(--line); border-radius:6px; background:var(--card); color:var(--ink); font-family:inherit"></label>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px">
          <button type="button" class="theme-toggle" id="cancelAddArt" style="cursor:pointer">Cancel</button>
          <button type="submit" class="theme-toggle" style="background:var(--blue); color:white; border-color:var(--blue); cursor:pointer">Save Article</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('cancelAddArt').onclick = () => modal.remove();
  
  document.getElementById('addArticleForm').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title').trim();
    const category = fd.get('category').trim();
    const description = fd.get('description').trim();
    const content = fd.get('content').trim();
    const author = fd.get('author').trim();
    const date = fd.get('date').trim();
    
    if (!title || !category || !description || !content) return;
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const dynamics = JSON.parse(localStorage.getItem('ashishJournal:dynamicArticles') || '[]');
    if (dynamics.some(a => a.slug === slug)) {
      alert('An article with this title or slug already exists.');
      return;
    }
    
    dynamics.push({ slug, title, category, description, content, author, date });
    localStorage.setItem('ashishJournal:dynamicArticles', JSON.stringify(dynamics));
    
    alert('Article created successfully!');
    modal.remove();
    location.reload();
  };
}

document.addEventListener('scroll',()=>{const bar=document.querySelector('[data-reading-progress]');if(!bar)return;const max=document.documentElement.scrollHeight-innerHeight;bar.style.width=`${max>0?(scrollY/max)*100:0}%`},{passive:true})
document.addEventListener('DOMContentLoaded',()=>{const saved=localStorage.getItem('samJournalTheme');const preferred=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';applyTheme(saved||preferred);document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.addEventListener('click',toggleTheme));document.querySelectorAll('[data-site-search]').forEach(f=>f.addEventListener('submit',handleSiteSearch));const params=new URLSearchParams(location.search);if(params.has('q'))filterArticles(params.get('q'));const u=encodeURIComponent(location.href),t=encodeURIComponent(document.title);document.querySelectorAll('[data-share-linkedin]').forEach(a=>{a.href=`https://www.linkedin.com/sharing/share-offsite/?url=${u}`;a.addEventListener('click',trackShare)});document.querySelectorAll('[data-share-x]').forEach(a=>{a.href=`https://twitter.com/intent/tweet?text=${t}&url=${u}`;a.addEventListener('click',trackShare)});document.querySelectorAll('[data-like-button]').forEach(b=>b.addEventListener('click',toggleLike));document.querySelectorAll('[data-comment-form]').forEach(f=>f.addEventListener('submit',addComment));updateEngagement(getSlug());

  // Inject Admin button next to theme toggle
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    const adminBtn = document.createElement('button');
    adminBtn.className = 'theme-toggle';
    adminBtn.style.marginLeft = '8px';
    adminBtn.textContent = isAdmin() ? 'Admin: On' : 'Admin';
    adminBtn.addEventListener('click', handleAdminToggle);
    navLinks.appendChild(adminBtn);
  }

  // Load dynamics & deletions
  renderDynamicArticles();

  // Inject Add Article button if admin is on homepage
  const isHome = location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/ashish-deshmukh-journal/') || location.pathname.endsWith('/sam-blog-site/');
  if (isAdmin() && isHome) {
    const titleSec = document.querySelector('.home-section .section-title');
    if (titleSec) {
      const addBtn = document.createElement('button');
      addBtn.className = 'mini-btn';
      addBtn.textContent = '+ Add Article';
      addBtn.style.marginLeft = '18px';
      addBtn.style.fontSize = '14px';
      addBtn.style.padding = '8px 16px';
      addBtn.addEventListener('click', showAddArticleModal);
      titleSec.appendChild(addBtn);
    }
  }
})
