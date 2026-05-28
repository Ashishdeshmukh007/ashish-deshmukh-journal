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
    if(pass === 'ashish1534'){
      localStorage.setItem('ashishJournalAdmin', 'yes');
      alert('Admin Mode activated successfully.');
      location.reload();
    } else {
      alert('Incorrect passcode.');
    }
  }
}

function autoFormatContent(rawText) {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('<section') || trimmed.startsWith('<p') || trimmed.startsWith('<div')) {
    return rawText; // Already HTML
  }
  
  let content = rawText;
  
  // 1) Parse [notes]...[/notes]
  content = content.replace(/\[notes\]([\s\S]*?)\[\/notes\]/g, (match, text) => {
    return `<div class="practitioner-card" data-practitioner="keep"><h4>Practitioner Notes</h4><p>${text.trim()}</p></div>`;
  });
  
  // 2) Parse [warning]...[/warning], [danger]...[/danger], [info]...[/info]
  content = content.replace(/\[warning\]([\s\S]*?)\[\/warning\]/g, (match, text) => {
    return `<div class="callout warning"><strong>Warning</strong><p>${text.trim()}</p></div>`;
  });
  content = content.replace(/\[danger\]([\s\S]*?)\[\/danger\]/g, (match, text) => {
    return `<div class="callout danger"><strong>Danger</strong><p>${text.trim()}</p></div>`;
  });
  content = content.replace(/\[info\]([\s\S]*?)\[\/info\]/g, (match, text) => {
    return `<div class="callout"><strong>Notice</strong><p>${text.trim()}</p></div>`;
  });
  
  // 3) Parse [formula]...[/formula]
  content = content.replace(/\[formula\]([\s\S]*?)\[\/formula\]/g, (match, text) => {
    return `<div class="copy-box"><div><strong>Formula / Code</strong></div><button class="mini-btn" onclick="copyText(this)">Copy</button><pre><code class="">${text.trim()}</code></pre></div>`;
  });
  
  // 4) Parse [excel title="..." size="..." sheets="..." link="..."]
  content = content.replace(/\[excel\s+title="([^"]+)"\s+size="([^"]+)"\s+sheets="([^"]+)"\s+link="([^"]+)"\s*\]/g, (match, title, size, sheets, link) => {
    return `
      <div class="workbook-embed" data-practitioner="keep" style="margin:20px 0">
        <div class="workbook-glass">
          <div>
            <span class="eyebrow">Embedded Excel Workbook</span>
            <h3 style="margin:6px 0">${title}</h3>
            <p style="margin:0 0 10px; font-size:14px; color:var(--muted)">This publisher-specific workbook is embedded inside this portal as a real .xlsx file with formulas, sample data, filters, frozen headers, assumptions, and executive summary logic.</p>
            <div class="workbook-meta"><span>${sheets}</span><span>${size}</span><span>Formula-backed ELP</span></div>
          </div>
          <a class="download-btn" download="${title.replace(/\s+/g, '_')}.xlsx" href="${link}">Download Excel</a>
        </div>
      </div>
    `;
  });
  
  // 5) Parse [calculator type="..."]
  content = content.replace(/\[calculator\s+type="([^"]+)"\s*\]/g, (match, type) => {
    if (type === 'oracle') {
      return `
        <div class="calc-card" data-practitioner="keep" style="margin:20px 0">
          <h3>Oracle Processor Calculator</h3>
          <label>Cores <input id="orclCores" type="number" value="20" oninput="calcOracle()"></label>
          <label>Core factor <input id="orclFactor" type="number" value="0.5" step="0.25" oninput="calcOracle()"></label>
          <button onclick="calcOracle()">Calculate</button>
          <output id="orclCalcOut" style="display:block; margin-top:10px; font-weight:700">Required: 10 Processor licenses</output>
        </div>
      `;
    } else if (type === 'ibm') {
      return `
        <div class="calc-card" data-practitioner="keep" style="margin:20px 0">
          <h3>IBM PVU Calculator</h3>
          <label>Sockets <input id="ibmSockets" type="number" value="2" oninput="calcIBM()"></label>
          <label>Cores per Socket <input id="ibmCores" type="number" value="8" oninput="calcIBM()"></label>
          <label>PVU per Core <input id="ibmPvu" type="number" value="70" step="10" oninput="calcIBM()"></label>
          <label>VM Allocated vCPUs <input id="ibmVcpu" type="number" value="4" oninput="calcIBM()"></label>
          <button onclick="calcIBM()">Calculate PVU</button>
          <output id="ibmCalcOut" style="display:block; margin-top:10px; font-weight:700">Full capacity: 1120 PVU | Sub-capacity: 280 PVU</output>
        </div>
      `;
    } else if (type === 'java') {
      return `
        <div class="calc-card" data-practitioner="keep" style="margin:20px 0">
          <h3>Java SE Universal Subscription Calculator</h3>
          <label>Employees <input id="javaEmpCount" type="number" value="1200" oninput="calcJavaCost()"></label>
          <label>Contractors <input id="javaContCount" type="number" value="300" oninput="calcJavaCost()"></label>
          <button onclick="calcJavaCost()">Calculate Annual Cost</button>
          <output id="javaCalcOut" style="display:block; margin-top:10px; font-weight:700">Annual Cost: $216,000 / year</output>
        </div>
      `;
    } else if (type === 'copilot') {
      return `
        <div class="calc-card" data-practitioner="keep" style="margin:20px 0">
          <h3>M365 Copilot Cost &amp; ROI Calculator</h3>
          <label>Assigned Seats <input id="copilotSeats" type="number" value="500" oninput="calcCopilotROI()"></label>
          <label>Inactive Users <input id="copilotInactive" type="number" value="150" oninput="calcCopilotROI()"></label>
          <label>Estimated Hours Saved/User <input id="copilotHours" type="number" value="4" oninput="calcCopilotROI()"></label>
          <button onclick="calcCopilotROI()">Calculate ROI</button>
          <output id="copilotCalcOut" style="display:block; margin-top:10px; font-weight:700">Annual Waste: $54,000 / year</output>
        </div>
      `;
    }
    return '';
  });

  const paragraphs = content.split(/\n\s*\n+/);
  let html = '';
  let currentSection = null;
  
  paragraphs.forEach((p, idx) => {
    const text = p.trim();
    if (!text) return;
    
    // Markdown table detection: starts and ends with |
    if (text.startsWith('|') && text.includes('\n|')) {
      const lines = text.split('\n');
      let tableHtml = '<div class="table-wrap"><table class="data-table"><thead>';
      let isBody = false;
      
      lines.forEach(line => {
        const cleanLine = line.trim().replace(/^\||\|$/g, '');
        if (cleanLine.includes('---')) {
          tableHtml += '</thead><tbody>';
          isBody = true;
          return;
        }
        
        const cols = cleanLine.split('|');
        tableHtml += '<tr>';
        cols.forEach(col => {
          const cleanCol = col.trim();
          tableHtml += isBody ? `<td>${cleanCol}</td>` : `<th>${cleanCol}</th>`;
        });
        tableHtml += '</tr>';
      });
      
      tableHtml += isBody ? '</tbody>' : '</thead>';
      tableHtml += '</table></div>';
      html += tableHtml;
      return;
    }
    
    // Pass raw HTML cards directly
    if (text.startsWith('<div') || text.startsWith('<section')) {
      html += text;
      return;
    }
    
    // Header logic: starts with # or ##, or is a short line without ending punctuation
    const isHeader = text.startsWith('##') || text.startsWith('#') || (text.length < 80 && !text.endsWith('.') && !text.endsWith('?') && !text.endsWith('!'));
    
    if (isHeader) {
      const cleanHeader = text.replace(/^#+\s*/, '');
      if (currentSection) {
        html += `</div></section>`;
      }
      const secId = `sec-${cleanHeader.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      html += `
        <section id="${secId}" class="portal-section" data-section-title="${cleanHeader}">
          <div class="section-toolbar">
            <h2>${cleanHeader}</h2>
            <button class="mini-btn" onclick="printSection('${secId}')">Print this section</button>
          </div>
          <div class="article-body">
      `;
      currentSection = secId;
    } else {
      if (!currentSection) {
        const secId = `sec-introduction`;
        html += `
          <section id="${secId}" class="portal-section" data-section-title="Introduction">
            <div class="section-toolbar">
              <h2>Introduction</h2>
              <button class="mini-btn" onclick="printSection('${secId}')">Print this section</button>
            </div>
            <div class="article-body">
        `;
        currentSection = secId;
      }
      
      if (text.includes('\n- ') || text.startsWith('- ')) {
        const items = text.split(/\n-?\s+/);
        let listHtml = '<ul>';
        items.forEach(item => {
          const cleanItem = item.replace(/^-\s*/, '').trim();
          if (cleanItem) listHtml += `<li>${cleanItem}</li>`;
        });
        listHtml += '</ul>';
        html += listHtml;
      } else {
        html += `<p>${text.replace(/\n/g, '<br>')}</p>`;
      }
    }
  });
  
  if (currentSection) {
    html += `</div></section>`;
  }
  
  return html;
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
function calcJavaCost(){const e=+document.getElementById('javaEmpCount')?.value||0,t=+document.getElementById('javaContCount')?.value||0,n=e+t;let a=0;n<=999?a=15:n<=2999?a=12:n<=8999?a=10.5:n<=19999?a=8.25:n<=49999?a=6.75:a=5.25;const r=n*a*12,c=document.getElementById('javaCalcOut');c&&(c.textContent=`Calculated Employees: ${n} | Tier Price: $${a.toFixed(2)}/mo | Annual Cost: $${r.toLocaleString()} / year`)}
function calcCopilotROI(){const e=+document.getElementById('copilotSeats')?.value||0,t=+document.getElementById('copilotInactive')?.value||0,n=+document.getElementById('copilotHours')?.value||0,a=360*e,r=360*t,c=Math.max(0,e-t),i=50*n,s=12*c*i,o=s-a,u=document.getElementById('copilotCalcOut');u&&(u.textContent=`Annual Spend: $${a.toLocaleString()} | Annual Inactive Waste: $${r.toLocaleString()} | Active Productivity ROI: $${s.toLocaleString()}/year | Net Benefit: $${o.toLocaleString()}/year`)}

function renderDynamicArticles(){
  const grid = document.querySelector('.article-grid');
  if(!grid) return;
  
  const deleted = JSON.parse(localStorage.getItem('ashishJournal:deletedArticles') || '[]');
  const hardEdits = JSON.parse(localStorage.getItem('ashishJournal:hardcodedEdits') || '{}');
  
  document.querySelectorAll('[data-article-card]').forEach(card => {
    const href = card.getAttribute('href') || '';
    const slug = href.split('/').pop().replace('.html', '');
    if(deleted.includes(slug)){
      card.remove();
    } else {
      if (hardEdits[slug]) {
        const prefix = (location.pathname.includes('/articles/')) ? '' : 'articles/';
        card.setAttribute('href', `${prefix}viewer.html?slug=${slug}`);
        card.querySelector('h2').textContent = hardEdits[slug].title;
        card.querySelector('p').textContent = hardEdits[slug].description;
        card.querySelector('.cat').textContent = hardEdits[slug].category;
        card.querySelector('.meta').textContent = `By ${hardEdits[slug].author || 'Ashish Deshmukh'} on ${hardEdits[slug].date}`;
      }
      
      if (isAdmin()) {
        injectAdminControls(card, slug, false);
      }
    }
  });
  
  const dynamics = JSON.parse(localStorage.getItem('ashishJournal:dynamicArticles') || '[]');
  dynamics.forEach(art => {
    if (deleted.includes(art.slug)) return;
    
    const card = document.createElement('a');
    card.className = 'article-card';
    card.setAttribute('data-article-card', '');
    
    const prefix = (location.pathname.includes('/articles/')) ? '' : 'articles/';
    card.setAttribute('href', `${prefix}viewer.html?slug=${art.slug}`);
    
    card.innerHTML = `
      <span class="cat">${art.category}</span>
      <h2>${art.title}</h2>
      <p>${art.description}</p>
      <div class="meta">By ${art.author || 'Ashish Deshmukh'} on ${art.date}</div>
    `;
    
    if (isAdmin()) {
      injectAdminControls(card, art.slug, true);
    }
    
    grid.insertBefore(card, grid.firstChild);
  });
}

function injectAdminControls(card, slug, isDynamic){
  card.style.position = 'relative';
  
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.display = 'flex';
  container.style.gap = '6px';
  container.style.zIndex = '10';
  
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.style.border = '1px solid var(--blue)';
  editBtn.style.borderRadius = '999px';
  editBtn.style.padding = '4px 10px';
  editBtn.style.background = 'var(--blue)';
  editBtn.style.color = '#fff';
  editBtn.style.fontSize = '11px';
  editBtn.style.fontWeight = '900';
  editBtn.style.cursor = 'pointer';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showEditArticleModal(slug, isDynamic);
  });
  
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.style.border = '1px solid #be123c';
  delBtn.style.borderRadius = '999px';
  delBtn.style.padding = '4px 10px';
  delBtn.style.background = '#be123c';
  delBtn.style.color = '#fff';
  delBtn.style.fontSize = '11px';
  delBtn.style.fontWeight = '900';
  delBtn.style.cursor = 'pointer';
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
  
  container.append(editBtn, delBtn);
  card.appendChild(container);
}

function serializeBlocks(blocks) {
  return blocks.map(b => {
    if (b.type === 'paragraph') return b.value;
    if (b.type === 'notes') return `[notes]\n${b.value}\n[/notes]`;
    if (b.type === 'warning') return `[warning]\n${b.value}\n[/warning]`;
    if (b.type === 'danger') return `[danger]\n${b.value}\n[/danger]`;
    if (b.type === 'info') return `[info]\n${b.value}\n[/info]`;
    if (b.type === 'formula') return `[formula]\n${b.value}\n[/formula]`;
    if (b.type === 'table') return b.value;
    if (b.type === 'calculator') return `[calculator type="${b.calcType}"]`;
    if (b.type === 'excel') return `[excel title="${b.title}" size="${b.size}" sheets="${b.sheets}" link="${b.link}"]`;
    return '';
  }).join('\n\n');
}

function parseRawContentToBlocks(rawText) {
  if (!rawText) return [{ type: 'paragraph', value: '' }];
  
  const blocks = [];
  let remaining = rawText.trim();
  
  while (remaining.length > 0) {
    const shortcodeRegex = /\[(notes|warning|danger|info|formula|calculator|excel)([^\]]*)\]([\s\S]*?)\[\/\1\]|\[(calculator|excel)([^\]]*)\]/i;
    const match = remaining.match(shortcodeRegex);
    
    if (!match) {
      const paragraphs = remaining.split(/\n\s*\n+/);
      paragraphs.forEach(p => {
        const val = p.trim();
        if (val) {
          if (val.startsWith('|') && val.includes('\n|')) {
            blocks.push({ type: 'table', value: val });
          } else {
            blocks.push({ type: 'paragraph', value: val });
          }
        }
      });
      break;
    }
    
    const matchIndex = match.index;
    if (matchIndex > 0) {
      const beforeText = remaining.substring(0, matchIndex).trim();
      if (beforeText) {
        const paragraphs = beforeText.split(/\n\s*\n+/);
        paragraphs.forEach(p => {
          const val = p.trim();
          if (val) {
            if (val.startsWith('|') && val.includes('\n|')) {
              blocks.push({ type: 'table', value: val });
            } else {
              blocks.push({ type: 'paragraph', value: val });
            }
          }
        });
      }
    }
    
    const fullMatch = match[0];
    const tag = (match[1] || match[4]).toLowerCase();
    
    if (tag === 'calculator') {
      const attrs = match[2] || match[5] || '';
      const typeMatch = attrs.match(/type="([^"]+)"/i) || attrs.match(/type='([^']+)'/i);
      const calcType = typeMatch ? typeMatch[1] : 'oracle';
      blocks.push({ type: 'calculator', calcType });
    } else if (tag === 'excel') {
      const attrs = match[2] || match[5] || '';
      const titleMatch = attrs.match(/title="([^"]+)"/i) || attrs.match(/title='([^']+)'/i);
      const sizeMatch = attrs.match(/size="([^"]+)"/i) || attrs.match(/size='([^']+)'/i);
      const sheetsMatch = attrs.match(/sheets="([^"]+)"/i) || attrs.match(/sheets='([^']+)'/i);
      const linkMatch = attrs.match(/link="([^"]+)"/i) || attrs.match(/link='([^']+)'/i);
      
      blocks.push({
        type: 'excel',
        title: titleMatch ? titleMatch[1] : 'SAM Workbook',
        size: sizeMatch ? sizeMatch[1] : '37.3 KB',
        sheets: sheetsMatch ? sheetsMatch[1] : '13 sheets',
        link: linkMatch ? linkMatch[1] : '../assets/Oracle_SAM_ELP_Workbook.xlsx'
      });
    } else {
      const content = match[3] || '';
      blocks.push({ type: tag, value: content.trim() });
    }
    
    remaining = remaining.substring(matchIndex + fullMatch.length).trim();
  }
  
  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', value: '' });
  }
  return blocks;
}

function setupRichEditor(modalContainer, form) {
  const textarea = form.querySelector('textarea[name="content"]');
  if (!textarea) return;
  
  textarea.style.display = 'none';
  
  const wrapper = document.createElement('div');
  wrapper.className = 'editor-textarea-wrapper';
  wrapper.innerHTML = `
    <div class="editor-tabs">
      <button type="button" class="editor-tab-btn active" data-tab="write">Visual Blocks</button>
      <button type="button" class="editor-tab-btn" data-tab="preview">Visual Live Preview</button>
    </div>
    <div data-editor-pane="write">
      <div class="editor-blocks-container"></div>
      <div class="editor-add-block-row">
        <span class="editor-add-block-label">+ Add New Component Block</span>
        <button type="button" class="editor-btn" data-add="paragraph">🔤 Plain Text</button>
        <button type="button" class="editor-btn" data-add="notes">🟦 Notes Card</button>
        <button type="button" class="editor-btn" data-add="warning">🟨 Warning</button>
        <button type="button" class="editor-btn" data-add="danger">🟥 Danger</button>
        <button type="button" class="editor-btn" data-add="info">⬜ Info Notice</button>
        <button type="button" class="editor-btn" data-add="formula">🖤 Formula Box</button>
        <button type="button" class="editor-btn" data-add="table">📊 Grid Table</button>
        <button type="button" class="editor-btn" data-add="calculator">🧮 Calculator</button>
        <button type="button" class="editor-btn" data-add="excel">📁 Excel Workbook</button>
      </div>
    </div>
    <div data-editor-pane="preview" style="display: none;">
      <div class="editor-preview-container article-body"></div>
    </div>
  `;
  
  const parentLabel = textarea.parentElement;
  parentLabel.insertBefore(wrapper, textarea);
  
  const blocksContainer = wrapper.querySelector('.editor-blocks-container');
  let blocksState = parseRawContentToBlocks(textarea.value);
  
  function syncToTextarea() {
    textarea.value = serializeBlocks(blocksState);
  }
  
  function renderBlocks() {
    blocksContainer.innerHTML = '';
    
    blocksState.forEach((block, idx) => {
      const card = document.createElement('div');
      card.className = 'editor-block-card';
      card.style.marginBottom = '12px';
      
      let title = '';
      if (block.type === 'paragraph') title = '🔤 Plain Text Paragraph';
      else if (block.type === 'notes') title = '🟦 Practitioner Notes Card (Blue)';
      else if (block.type === 'warning') title = '🟨 Warning Card (Amber)';
      else if (block.type === 'danger') title = '🟥 Danger Card (Red)';
      else if (block.type === 'info') title = '⬜ Info Notice Card (Gray)';
      else if (block.type === 'formula') title = '🖤 Formula Box (Black background)';
      else if (block.type === 'table') title = '📊 Grid Table Block';
      else if (block.type === 'calculator') title = '🧮 Interactive Calculator';
      else if (block.type === 'excel') title = '📁 Excel Workbook Attachment';
      
      let inputsHtml = '';
      if (block.type === 'calculator') {
        inputsHtml = `
          <label style="font-weight:700; font-size:12px">Calculator Type<br>
            <select class="editor-input block-calc-select" style="margin-top:4px">
              <option value="oracle" ${block.calcType === 'oracle' ? 'selected' : ''}>Oracle Processor Calculator</option>
              <option value="ibm" ${block.calcType === 'ibm' ? 'selected' : ''}>IBM PVU Calculator</option>
              <option value="java" ${block.calcType === 'java' ? 'selected' : ''}>Java SE Universal Subscription Calculator</option>
              <option value="copilot" ${block.calcType === 'copilot' ? 'selected' : ''}>M365 Copilot Cost & ROI Calculator</option>
            </select>
          </label>
        `;
      } else if (block.type === 'excel') {
        inputsHtml = `
          <div class="editor-block-grid">
            <label>Workbook Title<br><input class="editor-input excel-title" style="margin-top:4px" value="${block.title || ''}" placeholder="e.g. Oracle SAM ELP Workbook"></label>
            <label>File Size<br><input class="editor-input excel-size" style="margin-top:4px" value="${block.size || ''}" placeholder="e.g. 37.3 KB"></label>
            <label>Sheets Count<br><input class="editor-input excel-sheets" style="margin-top:4px" value="${block.sheets || ''}" placeholder="e.g. 13 sheets"></label>
            <label>Workbook Link / File Path<br><input class="editor-input excel-link" style="margin-top:4px" value="${block.link || ''}" placeholder="e.g. ../assets/Oracle_SAM_ELP_Workbook.xlsx"></label>
          </div>
        `;
      } else {
        let ph = 'Write content...';
        if (block.type === 'formula') ph = 'Enter mathematical formulas (e.g. SQL_Cores = Cores * Factor)';
        else if (block.type === 'table') ph = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
        
        inputsHtml = `
          <textarea class="editor-input block-text-input" style="height:70px; resize:vertical; font-family:${block.type === 'formula' || block.type === 'table' ? 'monospace' : 'inherit'}" placeholder="${ph}">${block.value || ''}</textarea>
        `;
      }
      
      card.innerHTML = `
        <div class="editor-block-header">
          <span class="editor-block-title">${title}</span>
          <div class="editor-block-actions">
            <button type="button" class="block-move-btn data-up">▲</button>
            <button type="button" class="block-move-btn data-down">▼</button>
            <button type="button" class="block-delete-btn">🗑️ Remove</button>
          </div>
        </div>
        <div class="editor-block-body">
          ${inputsHtml}
        </div>
      `;
      
      if (block.type === 'calculator') {
        const select = card.querySelector('.block-calc-select');
        select.onchange = (e) => {
          block.calcType = e.target.value;
          syncToTextarea();
        };
      } else if (block.type === 'excel') {
        const titleEl = card.querySelector('.excel-title');
        const sizeEl = card.querySelector('.excel-size');
        const sheetsEl = card.querySelector('.excel-sheets');
        const linkEl = card.querySelector('.excel-link');
        
        const updateExcel = () => {
          block.title = titleEl.value.trim();
          block.size = sizeEl.value.trim();
          block.sheets = sheetsEl.value.trim();
          block.link = linkEl.value.trim();
          syncToTextarea();
        };
        
        titleEl.oninput = updateExcel;
        sizeEl.oninput = updateExcel;
        sheetsEl.oninput = updateExcel;
        linkEl.oninput = updateExcel;
      } else {
        const textareaEl = card.querySelector('.block-text-input');
        textareaEl.oninput = (e) => {
          block.value = e.target.value;
          syncToTextarea();
        };
      }
      
      card.querySelector('.data-up').onclick = () => {
        if (idx === 0) return;
        const temp = blocksState[idx];
        blocksState[idx] = blocksState[idx - 1];
        blocksState[idx - 1] = temp;
        syncToTextarea();
        renderBlocks();
      };
      
      card.querySelector('.data-down').onclick = () => {
        if (idx === blocksState.length - 1) return;
        const temp = blocksState[idx];
        blocksState[idx] = blocksState[idx + 1];
        blocksState[idx + 1] = temp;
        syncToTextarea();
        renderBlocks();
      };
      
      card.querySelector('.block-delete-btn').onclick = () => {
        if (confirm("Remove this block?")) {
          blocksState.splice(idx, 1);
          if (blocksState.length === 0) {
            blocksState.push({ type: 'paragraph', value: '' });
          }
          syncToTextarea();
          renderBlocks();
        }
      };
      
      blocksContainer.appendChild(card);
    });
  }
  
  wrapper.querySelectorAll('.editor-add-block-row button').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.add;
      let newBlock = { type };
      if (type === 'calculator') {
        newBlock.calcType = 'oracle';
      } else if (type === 'excel') {
        newBlock.title = 'Oracle SAM ELP Workbook';
        newBlock.size = '37.3 KB';
        newBlock.sheets = '13 sheets';
        newBlock.link = '../assets/Oracle_SAM_ELP_Workbook.xlsx';
      } else if (type === 'table') {
        newBlock.value = `| Metric | Rule / Formula | Example | Watchout |\n| --- | --- | --- | --- |\n| Processor | Physical cores * factor | 20 cores * 0.5 = 10 licenses | Virtualization boundary drives cores |`;
      } else {
        newBlock.value = '';
      }
      blocksState.push(newBlock);
      syncToTextarea();
      renderBlocks();
      
      setTimeout(() => {
        blocksContainer.scrollTop = blocksContainer.scrollHeight;
      }, 50);
    };
  });
  
  renderBlocks();
  
  const tabBtns = wrapper.querySelectorAll('.editor-tab-btn');
  const writePaneDiv = wrapper.querySelector('[data-editor-pane="write"]');
  const previewPaneDiv = wrapper.querySelector('[data-editor-pane="preview"]');
  const previewContainer = wrapper.querySelector('.editor-preview-container');
  
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tab = btn.dataset.tab;
      if (tab === 'write') {
        writePaneDiv.style.display = 'block';
        previewPaneDiv.style.display = 'none';
        renderBlocks();
      } else {
        writePaneDiv.style.display = 'none';
        previewPaneDiv.style.display = 'block';
        
        const rawContent = textarea.value;
        const compiledHtml = autoFormatContent(rawContent);
        previewContainer.innerHTML = compiledHtml;
        
        const orclCores = previewContainer.querySelector('#orclCores');
        const orclFactor = previewContainer.querySelector('#orclFactor');
        if (orclCores && orclFactor) {
          orclCores.oninput = () => calcOracle();
          orclFactor.oninput = () => calcOracle();
          calcOracle();
        }
        
        const ibmSockets = previewContainer.querySelector('#ibmSockets');
        const ibmCores = previewContainer.querySelector('#ibmCores');
        const ibmPvu = previewContainer.querySelector('#ibmPvu');
        const ibmVcpu = previewContainer.querySelector('#ibmVcpu');
        if (ibmSockets && ibmCores && ibmPvu && ibmVcpu) {
          ibmSockets.oninput = () => calcIBM();
          ibmCores.oninput = () => calcIBM();
          ibmPvu.oninput = () => calcIBM();
          ibmVcpu.oninput = () => calcIBM();
          calcIBM();
        }
        
        const javaEmp = previewContainer.querySelector('#javaEmpCount');
        const javaCont = previewContainer.querySelector('#javaContCount');
        if (javaEmp && javaCont) {
          javaEmp.oninput = () => calcJavaCost();
          javaCont.oninput = () => calcJavaCost();
          calcJavaCost();
        }
        
        const copilotSeats = previewContainer.querySelector('#copilotSeats');
        const copilotInactive = previewContainer.querySelector('#copilotInactive');
        const copilotHours = previewContainer.querySelector('#copilotHours');
        if (copilotSeats && copilotInactive && copilotHours) {
          copilotSeats.oninput = () => calcCopilotROI();
          copilotInactive.oninput = () => calcCopilotROI();
          copilotHours.oninput = () => calcCopilotROI();
          calcCopilotROI();
        }
      }
    };
  });
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
    <div class="editor-modal-content">
      <h2 style="margin-top:0; font-size:24px">Add New Article</h2>
      <form id="addArticleForm" style="display:grid; gap:12px">
        <label style="font-weight:700; font-size:13px">Title<br><input name="title" required placeholder="e.g. Oracle Database Performance Tuning" class="editor-input"></label>
        <label style="font-weight:700; font-size:13px">Category / Topic<br><input name="category" required placeholder="e.g. Oracle Licensing" class="editor-input"></label>
        <label style="font-weight:700; font-size:13px">Summary / Deck<br><textarea name="description" required placeholder="e.g. A field guide to database tuning..." class="editor-input" style="height:60px; resize:vertical"></textarea></label>
        <label style="font-weight:700; font-size:13px">Content (HTML or Plain Text)<br><textarea name="content" required class="editor-input" style="height:200px; resize:vertical" placeholder="Write article content."></textarea></label>
        <div style="display:flex; gap:10px">
          <label style="flex:1; font-weight:700; font-size:13px">Author<br><input name="author" value="Ashish Deshmukh" class="editor-input"></label>
          <label style="flex:1; font-weight:700; font-size:13px">Date<br><input name="date" value="${new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}" class="editor-input"></label>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px">
          <button type="button" class="theme-toggle" id="cancelAddArt" style="cursor:pointer">Cancel</button>
          <button type="submit" class="theme-toggle" style="background:var(--blue); color:white; border-color:var(--blue); cursor:pointer">Save Article</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupRichEditor(modal, document.getElementById('addArticleForm'));
  
  document.getElementById('cancelAddArt').onclick = () => modal.remove();
  
  document.getElementById('addArticleForm').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title').trim();
    const category = fd.get('category').trim();
    const description = fd.get('description').trim();
    const rawContent = fd.get('content').trim();
    const author = fd.get('author').trim();
    const date = fd.get('date').trim();
    
    if (!title || !category || !description || !rawContent) return;
    
    const content = autoFormatContent(rawContent);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const dynamics = JSON.parse(localStorage.getItem('ashishJournal:dynamicArticles') || '[]');
    if (dynamics.some(a => a.slug === slug)) {
      alert('An article with this title or slug already exists.');
      return;
    }
    
    dynamics.push({ slug, title, category, description, content, author, date, rawContent });
    localStorage.setItem('ashishJournal:dynamicArticles', JSON.stringify(dynamics));
    
    alert('Article created successfully!');
    modal.remove();
    location.reload();
  };
}

function showEditArticleModal(slug, isDynamic){
  const modalId = 'editArticleModal';
  if(document.getElementById(modalId)) return;
  
  let article = null;
  if(isDynamic){
    const dynamics = JSON.parse(localStorage.getItem('ashishJournal:dynamicArticles') || '[]');
    article = dynamics.find(a => a.slug === slug);
  } else {
    const hardEdits = JSON.parse(localStorage.getItem('ashishJournal:hardcodedEdits') || '{}');
    article = hardEdits[slug] || {
      slug: slug,
      title: document.querySelector(`[href*="${slug}"] h2`)?.textContent || '',
      category: document.querySelector(`[href*="${slug}"] .cat`)?.textContent || '',
      description: document.querySelector(`[href*="${slug}"] p`)?.textContent || '',
      content: '',
      author: 'Ashish Deshmukh',
      date: new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})
    };
  }
  
  if(!article) return;
  
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
    <div class="editor-modal-content">
      <h2 style="margin-top:0; font-size:24px">Edit Article</h2>
      <form id="editArticleForm" style="display:grid; gap:12px">
        <label style="font-weight:700; font-size:13px">Title<br><input name="title" required value="${article.title}" class="editor-input"></label>
        <label style="font-weight:700; font-size:13px">Category / Topic<br><input name="category" required value="${article.category}" class="editor-input"></label>
        <label style="font-weight:700; font-size:13px">Summary / Deck<br><textarea name="description" required class="editor-input" style="height:60px; resize:vertical">${article.description}</textarea></label>
        <label style="font-weight:700; font-size:13px">Content (HTML or Plain Text)<br><textarea name="content" required class="editor-input" style="height:200px; resize:vertical" placeholder="Write article content.">${article.rawContent || article.content || ''}</textarea></label>
        <div style="display:flex; gap:10px">
          <label style="flex:1; font-weight:700; font-size:13px">Author<br><input name="author" value="${article.author || 'Ashish Deshmukh'}" class="editor-input"></label>
          <label style="flex:1; font-weight:700; font-size:13px">Date<br><input name="date" value="${article.date}" class="editor-input"></label>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px">
          <button type="button" class="theme-toggle" id="cancelEditArt" style="cursor:pointer">Cancel</button>
          <button type="submit" class="theme-toggle" style="background:var(--blue); color:white; border-color:var(--blue); cursor:pointer">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupRichEditor(modal, document.getElementById('editArticleForm'));
  
  document.getElementById('cancelEditArt').onclick = () => modal.remove();
  
  document.getElementById('editArticleForm').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title').trim();
    const category = fd.get('category').trim();
    const description = fd.get('description').trim();
    const rawContent = fd.get('content').trim();
    const author = fd.get('author').trim();
    const date = fd.get('date').trim();
    
    if (!title || !category || !description || !rawContent) return;
    
    const content = autoFormatContent(rawContent);
    
    if(isDynamic){
      const dynamics = JSON.parse(localStorage.getItem('ashishJournal:dynamicArticles') || '[]');
      const idx = dynamics.findIndex(a => a.slug === slug);
      if(idx !== -1){
        dynamics[idx] = { slug, title, category, description, content, author, date, rawContent };
        localStorage.setItem('ashishJournal:dynamicArticles', JSON.stringify(dynamics));
      }
    } else {
      const hardEdits = JSON.parse(localStorage.getItem('ashishJournal:hardcodedEdits') || '{}');
      hardEdits[slug] = { slug, title, category, description, content, author, date, rawContent };
      localStorage.setItem('ashishJournal:hardcodedEdits', JSON.stringify(hardEdits));
    }
    
    alert('Article updated successfully!');
    modal.remove();
    location.reload();
  };
}


function showAdminDashboard(){
  const modalId = 'adminDashboardModal';
  if(document.getElementById(modalId)) return;
  
  const dynamics = JSON.parse(localStorage.getItem('ashishJournal:dynamicArticles') || '[]');
  const deleted = JSON.parse(localStorage.getItem('ashishJournal:deletedArticles') || '[]');
  const hardEdits = JSON.parse(localStorage.getItem('ashishJournal:hardcodedEdits') || '{}');
  
  let totalComments = 0;
  for(let i=0; i<localStorage.length; i++){
    const key = localStorage.key(i);
    if(key.includes(':comments')){
      try {
        const comments = JSON.parse(localStorage.getItem(key) || '[]');
        totalComments += comments.length;
      } catch {}
    }
  }
  
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
    <div class="calc-card" style="width: 100%; max-width: 500px; background: var(--paper); border: 1px solid var(--line); box-shadow: var(--shadow); border-radius:14px; padding:22px">
      <h2 style="margin-top:0; font-size:24px">Admin Dashboard &amp; Analytics</h2>
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin:16px 0">
        <div style="background:var(--soft); border:1px solid var(--line); border-radius:8px; padding:12px; text-align:center">
          <div style="font-size:28px; font-weight:900; color:var(--blue)">13</div>
          <div style="font-size:12px; color:var(--muted)">Hardcoded Articles</div>
        </div>
        <div style="background:var(--soft); border:1px solid var(--line); border-radius:8px; padding:12px; text-align:center">
          <div style="font-size:28px; font-weight:900; color:var(--blue)">${dynamics.length}</div>
          <div style="font-size:12px; color:var(--muted)">Dynamic Articles</div>
        </div>
        <div style="background:var(--soft); border:1px solid var(--line); border-radius:8px; padding:12px; text-align:center">
          <div style="font-size:28px; font-weight:900; color:#be123c">${deleted.length}</div>
          <div style="font-size:12px; color:var(--muted)">Deleted Articles</div>
        </div>
        <div style="background:var(--soft); border:1px solid var(--line); border-radius:8px; padding:12px; text-align:center">
          <div style="font-size:28px; font-weight:900; color:var(--green)">${totalComments}</div>
          <div style="font-size:12px; color:var(--muted)">Total Comments</div>
        </div>
      </div>
      <p style="font-size:13px; color:var(--muted)">Edits Applied to Hardcoded Articles: <b>${Object.keys(hardEdits).length}</b></p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; border-top:1px solid var(--line); padding-top:16px">
        <button type="button" class="theme-toggle" id="resetAllData" style="background:#be123c; color:white; border-color:#be123c; cursor:pointer">Reset All Site Data</button>
        <button type="button" class="theme-toggle" id="closeDashboard" style="cursor:pointer">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('closeDashboard').onclick = () => modal.remove();
  
  document.getElementById('resetAllData').onclick = () => {
    if(confirm('Are you sure you want to completely reset all dynamic articles, comments, edits, and deletions? This action is irreversible.')){
      localStorage.clear();
      alert('All local database records cleared successfully.');
      location.reload();
    }
  };
}

document.addEventListener('scroll',()=>{const bar=document.querySelector('[data-reading-progress]');if(!bar)return;const max=document.documentElement.scrollHeight-innerHeight;bar.style.width=`${max>0?(scrollY/max)*100:0}%`},{passive:true})
document.addEventListener('DOMContentLoaded',()=> {
  const saved = localStorage.getItem('samJournalTheme');
  const preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || preferred);
  document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', toggleTheme));
  document.querySelectorAll('[data-site-search]').forEach(f => f.addEventListener('submit', handleSiteSearch));
  const params = new URLSearchParams(location.search);
  if (params.has('q')) filterArticles(params.get('q'));
  const u = encodeURIComponent(location.href), t = encodeURIComponent(document.title);
  document.querySelectorAll('[data-share-linkedin]').forEach(a => {
    a.href = `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    a.addEventListener('click', trackShare)
  });
  document.querySelectorAll('[data-share-x]').forEach(a => {
    a.href = `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    a.addEventListener('click', trackShare)
  });
  document.querySelectorAll('[data-like-button]').forEach(b => b.addEventListener('click', toggleLike));
  document.querySelectorAll('[data-comment-form]').forEach(f => f.addEventListener('submit', addComment));
  updateEngagement(getSlug());

  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    const adminBtn = document.createElement('button');
    adminBtn.className = 'theme-toggle';
    adminBtn.style.marginLeft = '8px';
    adminBtn.textContent = isAdmin() ? 'Admin: On' : 'Admin';
    adminBtn.addEventListener('click', handleAdminToggle);
    navLinks.appendChild(adminBtn);
  }

  renderDynamicArticles();

  const isHome = location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/ashish-deshmukh-journal/') || location.pathname.endsWith('/sam-blog-site/');
  if (isHome) {
    const titleSec = document.querySelector('.home-section .section-title');
    if (titleSec) {
      const container = document.createElement('div');
      container.style.display = 'inline-flex';
      container.style.gap = '10px';
      container.style.marginLeft = '18px';
      
      const addBtn = document.createElement('button');
      addBtn.className = 'mini-btn';
      addBtn.textContent = '+ Add Article';
      addBtn.style.fontSize = '14px';
      addBtn.style.padding = '8px 16px';
      addBtn.addEventListener('click', showAddArticleModal);
      container.appendChild(addBtn);
      
      if (isAdmin()) {
        const dashBtn = document.createElement('button');
        dashBtn.className = 'mini-btn';
        dashBtn.textContent = 'Admin Dashboard';
        dashBtn.style.fontSize = '14px';
        dashBtn.style.padding = '8px 16px';
        dashBtn.style.border = '1px solid var(--blue)';
        dashBtn.style.background = 'var(--blue)';
        dashBtn.style.color = '#fff';
        dashBtn.addEventListener('click', showAdminDashboard);
        container.appendChild(dashBtn);
      }
      
      titleSec.appendChild(container);
    }
  }
})
