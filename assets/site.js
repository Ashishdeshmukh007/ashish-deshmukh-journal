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
  content = content.replace(/\[calculator\s+([^\]]+)\]/g, (match, attrsStr) => {
    const typeMatch = attrsStr.match(/type="([^"]+)"/i) || attrsStr.match(/type='([^']+)'/i);
    const type = typeMatch ? typeMatch[1] : 'oracle';
    
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
    } else if (type === 'custom') {
      const titleMatch = attrsStr.match(/title="([^"]+)"/i) || attrsStr.match(/title='([^']+)'/i);
      const formulaMatch = attrsStr.match(/formula="([^"]+)"/i) || attrsStr.match(/formula='([^']+)'/i);
      const outputMatch = attrsStr.match(/output="([^"]+)"/i) || attrsStr.match(/output='([^']+)'/i);
      const inputsMatch = attrsStr.match(/inputs="([^"]+)"/i) || attrsStr.match(/inputs='([^']+)'/i);
      
      const title = titleMatch ? titleMatch[1] : 'Custom Calculator';
      const formula = formulaMatch ? formulaMatch[1] : 'X * Y';
      const output = outputMatch ? outputMatch[1] : 'Result: {result}';
      const inputsStr = inputsMatch ? inputsMatch[1] : 'X:10|Y:2';
      
      const calcId = 'custom_calc_' + Math.random().toString(36).substr(2, 9);
      
      const fields = inputsStr.split('|').map(f => {
        const parts = f.split(':');
        return {
          label: parts[0] || 'Field',
          val: parts[1] || '0',
          varName: (parts[0] || 'Field').replace(/[^a-zA-Z0-9]/g, '')
        };
      });
      
      let fieldsHtml = '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:12px;">';
      fields.forEach(field => {
        fieldsHtml += `
          <label style="font-weight:700; font-size:12px; display:block;">${field.label}<br>
            <input type="number" class="editor-input ${calcId}_input" data-var="${field.varName}" value="${field.val}" style="margin-top:4px;" oninput="evaluateCustomCalc('${calcId}', '${formula.replace(/'/g, "\\'")}', '${output.replace(/'/g, "\\'")}')">
          </label>
        `;
      });
      fieldsHtml += '</div>';
      
      return `
        <div class="calc-card" data-practitioner="keep" style="margin:20px 0" id="${calcId}" data-formula="${formula.replace(/"/g, '&quot;')}" data-output="${output.replace(/"/g, '&quot;')}">
          <h3>${title}</h3>
          ${fieldsHtml}
          <button class="editor-btn" onclick="evaluateCustomCalc('${calcId}', '${formula.replace(/'/g, "\\'")}', '${output.replace(/'/g, "\\'")}')" style="display:none;">Calculate</button>
          <output class="${calcId}_output" style="display:block; margin-top:10px; font-weight:700">${output.replace('{result}', '...')}</output>
          <script>
            setTimeout(() => {
              if (typeof evaluateCustomCalc === 'function') {
                evaluateCustomCalc('${calcId}', '${formula.replace(/'/g, "\\'")}', '${output.replace(/'/g, "\\")}');
              }
            }, 100);
          </script>
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

window.evaluateCustomCalc = function(calcId, formula, outputTemplate) {
  const container = document.getElementById(calcId);
  if (!container) return;
  
  const inputs = container.querySelectorAll("." + calcId + "_input");
  const context = {};
  inputs.forEach(input => {
    const varName = input.dataset.var;
    context[varName] = +input.value || 0;
  });
  
  let result = 0;
  try {
    const keys = Object.keys(context);
    const vals = Object.values(context);
    const fn = new Function(...keys, "return (" + formula + ");");
    result = fn(...vals);
  } catch(e) {
    result = NaN;
  }
  
  if (isNaN(result)) {
    result = "Error in formula";
  } else {
    if (result % 1 !== 0) {
      result = result.toFixed(2);
    } else {
      result = result.toString();
    }
  }
  
  const outEl = container.querySelector("." + calcId + "_output");
  if (outEl) {
    outEl.textContent = outputTemplate.replace("{result}", result);
  }
};

window.initializeCustomCalculators = function(container = document) {
  container.querySelectorAll('.calc-card[data-formula]').forEach(calcEl => {
    const calcId = calcEl.id;
    const formula = calcEl.dataset.formula || '';
    const output = calcEl.dataset.output || '';
    if (typeof window.evaluateCustomCalc === 'function') {
      window.evaluateCustomCalc(calcId, formula, output);
    }
  });
};



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
    if (b.type === 'calculator') {
      if (b.calcType === 'custom') {
        return `[calculator type="custom" title="${b.title || 'Custom Calculator'}" formula="${b.formula || 'Cores * Factor'}" output="${b.output || 'Required Licenses: {result}'}" inputs="${b.inputs || 'Cores:16|Factor:0.5'}"]`;
      }
      return `[calculator type="${b.calcType}"]`;
    }
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
      
      if (calcType === 'custom') {
        const titleMatch = attrs.match(/title="([^"]+)"/i) || attrs.match(/title='([^']+)'/i);
        const formulaMatch = attrs.match(/formula="([^"]+)"/i) || attrs.match(/formula='([^']+)'/i);
        const outputMatch = attrs.match(/output="([^"]+)"/i) || attrs.match(/output='([^']+)'/i);
        const inputsMatch = attrs.match(/inputs="([^"]+)"/i) || attrs.match(/inputs='([^']+)'/i);
        
        blocks.push({
          type: 'calculator',
          calcType: 'custom',
          title: titleMatch ? titleMatch[1] : 'Custom Calculator',
          formula: formulaMatch ? formulaMatch[1] : 'Cores * Factor',
          output: outputMatch ? outputMatch[1] : 'Required Licenses: {result}',
          inputs: inputsMatch ? inputsMatch[1] : 'Cores:16|Factor:0.5'
        });
      } else {
        blocks.push({ type: 'calculator', calcType });
      }
    } else if (tag === 'excel') {
      const attrs = match[2] || match[5] || '';
      const titleMatch = attrs.match(/title="([^"]+)"/i) || attrs.match(/title='([^']+)'/i);
      const sizeMatch = attrs.match(/size="([^"]+)"/i) || attrs.match(/size='([^']+)'/i);
      const sheetsMatch = attrs.match(/sheets="([^"]+)"/i) || attrs.match(/sheets='([^']+)'/i);
      const linkMatch = attrs.match(/link="([^"]+)"/i) || attrs.match(/link='([^']+)'/i);
      
      const t = titleMatch ? titleMatch[1] : 'SAM Workbook';
      const s = sizeMatch ? sizeMatch[1] : '37.3 KB';
      const sh = sheetsMatch ? sheetsMatch[1] : '13 sheets';
      const l = linkMatch ? linkMatch[1] : '../assets/Oracle_SAM_ELP_Workbook.xlsx';
      
      let preset = 'custom';
      if (l.includes('Oracle_SAM_ELP_Workbook')) preset = 'oracle';
      else if (l.includes('IBM_SAM_ELP_Workbook')) preset = 'ibm';
      else if (l.includes('Microsoft_SAM_ELP_Workbook')) preset = 'microsoft';
      
      blocks.push({
        type: 'excel',
        preset,
        title: t,
        size: s,
        sheets: sh,
        link: l
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

function parseTable(mdText) {
  if (!mdText) return [['Header 1', 'Header 2'], ['Cell 1', 'Cell 2']];
  const lines = mdText.trim().split('\n');
  const rows = [];
  lines.forEach(line => {
    if (line.includes('---')) return;
    const cleanLine = line.trim().replace(/^\||\|$/g, '');
    if (cleanLine) {
      const cols = cleanLine.split('|').map(c => c.trim());
      rows.push(cols);
    }
  });
  if (rows.length === 0) {
    return [['Header 1', 'Header 2'], ['Cell 1', 'Cell 2']];
  }
  return rows;
}

function serializeTable(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = rows[0];
  const dividers = headers.map(() => '---');
  const body = rows.slice(1);
  
  let md = '| ' + headers.join(' | ') + ' |\n';
  md += '| ' + dividers.join(' | ') + ' |\n';
  body.forEach(row => {
    md += '| ' + row.join(' | ') + ' |\n';
  });
  return md;
}

function parseVariables(inputStr) {
  if (!inputStr) return [{ label: 'Cores', val: '16' }, { label: 'Factor', val: '0.5' }];
  return inputStr.split('|').map(s => {
    const p = s.split(':');
    return { label: p[0] || 'Variable', val: p[1] || '0' };
  });
}

function serializeVariables(arr) {
  return arr.map(item => `${item.label.trim()}:${item.val.trim()}`).join('|');
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
      else if (block.type === 'table') title = '📊 Visual Table Editor';
      else if (block.type === 'calculator') title = '🧮 Interactive Calculator';
      else if (block.type === 'excel') title = '📁 Excel Workbook Attachment';
      
      let inputsHtml = '';
      if (block.type === 'calculator') {
        inputsHtml = `
          <label style="font-weight:700; font-size:12.5px; display:block; margin-bottom:6px; color:var(--ink);">
            Select Calculator Type
            <select class="editor-input block-calc-select" style="margin-top:4px; font-weight:600; border-color:var(--line);">
              <option value="oracle" ${block.calcType === 'oracle' ? 'selected' : ''}>Oracle Processor Calculator (Database & MW)</option>
              <option value="ibm" ${block.calcType === 'ibm' ? 'selected' : ''}>IBM PVU Calculator (Full vs Sub-capacity)</option>
              <option value="java" ${block.calcType === 'java' ? 'selected' : ''}>Java SE Universal Subscription Calculator</option>
              <option value="copilot" ${block.calcType === 'copilot' ? 'selected' : ''}>M365 Copilot Cost & ROI Calculator</option>
              <option value="custom" ${block.calcType === 'custom' ? 'selected' : ''}>🛠️ Create Custom Calculator...</option>
            </select>
          </label>
          
          <div class="custom-calc-fields" style="display: ${block.calcType === 'custom' ? 'block' : 'none'}; padding:14px; border:1px solid var(--line); border-radius:10px; margin-top:10px; background:var(--soft);">
            <div style="font-size:11.5px; font-weight:800; color:var(--blue); text-transform:uppercase; margin-bottom:10px; letter-spacing:0.03em;">🛠️ Custom Calculator Builder:</div>
            
            <label style="font-weight:700; font-size:12px; display:block; margin-bottom:10px;">Calculator Title<br>
              <input class="editor-input calc-custom-title" style="margin-top:4px;" value="${block.title || 'Custom Calculator'}" placeholder="e.g. SQL Server License Calculator">
            </label>
            
            <div style="margin-bottom:10px;">
              <span style="font-weight:700; font-size:12px; display:block; margin-bottom:6px;">Variables & Default Values</span>
              <div class="calc-variables-container" style="display:flex; flex-direction:column; gap:6px; margin-bottom:6px;">
                <!-- Dynamically populated variable rows -->
              </div>
              <button type="button" class="mini-btn add-var-btn" style="font-size:11px; padding:4px 8px; border-radius:6px;">➕ Add Variable</button>
            </div>
            
            <label style="font-weight:700; font-size:12px; display:block; margin-bottom:10px;">Calculation Formula<br>
              <input class="editor-input calc-custom-formula" style="margin-top:4px; font-family:monospace;" value="${block.formula || 'Cores * Factor'}" placeholder="e.g. Cores * Factor">
              <span style="font-size:11px; color:var(--muted); font-weight:normal; display:block; margin-top:4px;">
                💡 <em>Use the Variable names above in your mathematical expression (e.g. \`Cores * Factor\`). Supported: \`*\`, \`/\`, \`+\`, \`-\`, \`(\`, \`)\`.</em>
              </span>
            </label>
            
            <label style="font-weight:700; font-size:12px; display:block; margin-bottom:6px;">Output Text Template<br>
              <input class="editor-input calc-custom-output" style="margin-top:4px;" value="${block.output || 'Required Licenses: {result} Cores'}" placeholder="e.g. Total cost: {result}">
              <span style="font-size:11px; color:var(--muted); font-weight:normal; display:block; margin-top:4px;">
                💡 <em>Use \`{result}\` where the calculated number should be placed.</em>
              </span>
            </label>
          </div>
          
          <div class="calc-editor-preview" style="margin-top:12px; padding:14px; border:1px dashed var(--blue); border-radius:10px; background:var(--soft);">
            <div style="font-size:10px; font-weight:800; color:var(--blue); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.05em;">Interactive Simulator (Try it!):</div>
            <div class="calc-card" style="padding:14px; margin:0; border:1px solid var(--line); border-radius:10px; background:var(--card);">
              <h4 class="calc-preview-title" style="margin:0 0 10px; font-size:14px; font-weight:800; color:var(--ink);">${block.title || 'Calculator'}</h4>
              <div class="calc-preview-fields" style="display:grid; gap:8px;">
                <!-- Filled dynamically by JS -->
              </div>
              <div class="calc-preview-result" style="margin-top:12px; padding:8px 10px; background:color-mix(in srgb, var(--blue) 8%, var(--card)); border-left:3px solid var(--blue); border-radius:4px; font-weight:700; font-size:13px; color:var(--ink);">
                Required: 10 Processor licenses
              </div>
            </div>
            <div style="margin-top:8px; font-size:11.5px; color:var(--muted); line-height:1.4;">
              ℹ️ <em>This interactive form will be automatically embedded in your published article. Readers will be able to type their own numbers to get calculations instantly.</em>
            </div>
          </div>
        `;
      } else if (block.type === 'excel') {
        inputsHtml = `
          <label style="font-weight:700; font-size:12.5px; display:block; margin-bottom:8px; color:var(--ink);">
            Select Pre-configured Workbook
            <select class="editor-input excel-preset-select" style="margin-top:4px; font-weight:600; border-color:var(--line);">
              <option value="oracle" ${block.preset === 'oracle' ? 'selected' : ''}>Oracle SAM ELP Workbook (Preset - 37.3 KB, 13 sheets)</option>
              <option value="ibm" ${block.preset === 'ibm' ? 'selected' : ''}>IBM SAM ELP Workbook (Preset - 38.8 KB, 11 sheets)</option>
              <option value="microsoft" ${block.preset === 'microsoft' ? 'selected' : ''}>Microsoft SAM ELP Workbook (Preset - 37.4 KB, 12 sheets)</option>
              <option value="custom" ${block.preset === 'custom' ? 'selected' : ''}>Custom Workbook Attachment...</option>
            </select>
          </label>
          
          <div class="custom-excel-fields" style="display: none; padding:14px; border:1px solid var(--line); border-radius:10px; margin-bottom:12px; background:var(--soft);">
            <div style="font-size:11.5px; font-weight:800; color:var(--green); text-transform:uppercase; margin-bottom:10px; letter-spacing:0.03em;">📂 Upload Custom Excel File:</div>
            
            <div style="margin-bottom:14px; background:var(--paper); padding:12px; border:1px dashed var(--green); border-radius:8px;">
              <label style="font-weight:700; font-size:12px; display:block; cursor:pointer;">
                Select custom Excel file (.xlsx, .xls) to upload:<br>
                <input type="file" class="excel-file-upload-input" accept=".xlsx,.xls" style="margin-top:6px; font-size:12px; width:100%;">
              </label>
              <div class="excel-upload-status" style="margin-top:8px; font-size:12px; font-weight:700; color:var(--green); display:none;"></div>
            </div>
            
            <div class="editor-block-grid">
              <label>Workbook Title<br><input class="editor-input excel-title" style="margin-top:4px" value="${block.title || ''}" placeholder="e.g. My SAM Workbook"></label>
              <label>File Size<br><input class="editor-input excel-size" style="margin-top:4px" value="${block.size || ''}" placeholder="e.g. 24 KB"></label>
              <label>Sheets Count<br><input class="editor-input excel-sheets" style="margin-top:4px" value="${block.sheets || ''}" placeholder="e.g. 5 sheets"></label>
              <label>Workbook Link / File Path / Data URL<br><input class="editor-input excel-link" style="margin-top:4px" value="${block.link || ''}" placeholder="e.g. data:application/..."></label>
            </div>
          </div>
          
          <div class="excel-editor-preview" style="margin-top:12px; padding:14px; border:1px dashed var(--green); border-radius:10px; background:var(--soft);">
            <div style="font-size:10px; font-weight:800; color:var(--green); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.05em;">Live Preview in Article:</div>
            
            <div class="workbook-glass" style="margin:0; padding:14px; border:1px solid var(--line); border-radius:10px; background:var(--card); display:grid; grid-template-columns:1fr auto; gap:16px; align-items:center;">
              <div>
                <span class="eyebrow" style="font-size:11px; border:1px solid var(--line); border-radius:999px; padding:3px 8px; background:var(--soft); font-weight:800; color:var(--blue);">Embedded Excel Workbook</span>
                <h4 class="excel-preview-title" style="margin:6px 0 4px; font-size:15px; font-weight:800; color:var(--ink);">${block.title || ''}</h4>
                <div class="workbook-meta" style="display:flex; gap:6px; flex-wrap:wrap;">
                  <span class="excel-preview-sheets" style="font-size:11px; border:1px solid var(--line); border-radius:999px; padding:3px 8px; background:var(--paper); font-weight:700;">${block.sheets || ''}</span>
                  <span class="excel-preview-size" style="font-size:11px; border:1px solid var(--line); border-radius:999px; padding:3px 8px; background:var(--paper); font-weight:700;">${block.size || ''}</span>
                  <span style="font-size:11px; border:1px solid var(--line); border-radius:999px; padding:3px 8px; background:var(--paper); font-weight:700; color:var(--green);">Formula-backed ELP</span>
                </div>
              </div>
              <button type="button" class="download-btn" style="background:var(--blue); border-color:var(--blue); color:white; border-radius:999px; padding:8px 14px; font-weight:800; font-size:12px; cursor:pointer;">Download Excel</button>
            </div>
            <div style="margin-top:8px; font-size:11.5px; color:var(--muted); line-height:1.4;">
              ℹ️ <em>This widget will let your readers download the fully formulated SAM workbook directly. The presets are linked to pre-uploaded files in the assets directory.</em>
            </div>
          </div>
        `;
      } else if (block.type === 'table') {
        let grid = parseTable(block.value || '');
        let tableHtml = `
          <div style="overflow-x:auto; margin-bottom:8px; border:1px solid var(--line); border-radius:8px; background:var(--card); box-shadow:0 2px 8px rgba(0,0,0,0.02);">
            <table style="width:100%; border-collapse:collapse; min-width:300px;">
        `;
        
        grid.forEach((row, rIdx) => {
          tableHtml += `<tr style="border-bottom:1px solid var(--line); transition:background 0.2s;">`;
          row.forEach((cell, cIdx) => {
            const isHeader = rIdx === 0;
            const bg = isHeader ? 'var(--soft)' : 'var(--card)';
            const fw = isHeader ? 'bold' : 'normal';
            const color = isHeader ? 'var(--ink)' : 'inherit';
            
            tableHtml += `
              <td style="padding:6px; border-right:1px solid var(--line); background:${bg};">
                <input class="editor-input table-cell-input" data-row="${rIdx}" data-col="${cIdx}" value="${cell.replace(/"/g, '&quot;')}" style="font-weight:${fw}; color:${color}; padding:8px; font-size:13px; border:1px solid transparent; border-radius:4px; outline:none; background:transparent; width:100%; transition:all 0.2s;" placeholder="${isHeader ? 'Header cell...' : 'Data cell...'}" onfocus="this.style.borderColor='var(--blue)'; this.style.background='var(--paper)';" onblur="this.style.borderColor='transparent'; this.style.background='transparent';">
              </td>
            `;
          });
          tableHtml += `</tr>`;
        });
        tableHtml += `</table></div>`;
        
        inputsHtml = `
          <div style="margin-bottom:8px; font-size:12px; color:var(--muted); line-height:1.4;">
            💡 <strong>Visual Spreadsheet Editor:</strong> Double-click any cell above to edit text. 
            The first row (shaded gray) will be formatted as the table header.
          </div>
          ${tableHtml}
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            <button type="button" class="mini-btn add-row-btn" style="border-radius:6px; padding:6px 10px; font-size:11.5px; font-weight:700;">➕ Add Row</button>
            <button type="button" class="mini-btn add-col-btn" style="border-radius:6px; padding:6px 10px; font-size:11.5px; font-weight:700;">➕ Add Column</button>
            <button type="button" class="mini-btn del-row-btn" style="border-radius:6px; padding:6px 10px; font-size:11.5px; font-weight:700; color:var(--red); border-color:var(--red);">🗑️ Delete Row</button>
            <button type="button" class="mini-btn del-col-btn" style="border-radius:6px; padding:6px 10px; font-size:11.5px; font-weight:700; color:var(--red); border-color:var(--red);">🗑️ Delete Column</button>
          </div>
        `;
      } else {
        let ph = 'Write content...';
        if (block.type === 'formula') ph = 'Enter mathematical formulas (e.g. SQL_Cores = Cores * Factor)';
        
        inputsHtml = `
          <textarea class="editor-input block-text-input" style="height:70px; resize:vertical; font-family:${block.type === 'formula' ? 'monospace' : 'inherit'}" placeholder="${ph}">${block.value || ''}</textarea>
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
        const customFieldsDiv = card.querySelector('.custom-calc-fields');
        const customTitleIn = card.querySelector('.calc-custom-title');
        const customFormulaIn = card.querySelector('.calc-custom-formula');
        const customOutputIn = card.querySelector('.calc-custom-output');
        const variablesContainer = card.querySelector('.calc-variables-container');
        
        const previewFields = card.querySelector('.calc-preview-fields');
        const previewTitle = card.querySelector('.calc-preview-title');
        const previewResult = card.querySelector('.calc-preview-result');
        
        let varsList = parseVariables(block.inputs || 'Cores:16|Factor:0.5');
        
        const renderVariableRows = () => {
          variablesContainer.innerHTML = '';
          varsList.forEach((v, vIdx) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '6px';
            row.style.alignItems = 'center';
            row.style.marginBottom = '4px';
            
            row.innerHTML = `
              <input class="editor-input var-label" style="padding:4px 6px; font-size:12px; flex:2;" value="${v.label}" placeholder="Variable Name">
              <input class="editor-input var-val" type="number" style="padding:4px 6px; font-size:12px; flex:1;" value="${v.val}" placeholder="Default Value">
              <button type="button" class="mini-btn del-var-btn" style="color:var(--red); border-color:var(--red); padding:3px 6px; font-size:11px;">🗑️</button>
            `;
            
            const labelIn = row.querySelector('.var-label');
            const valIn = row.querySelector('.var-val');
            const delBtn = row.querySelector('.del-var-btn');
            
            labelIn.oninput = (e) => {
              varsList[vIdx].label = e.target.value;
              block.inputs = serializeVariables(varsList);
              syncToTextarea();
              renderSimulator();
            };
            
            valIn.oninput = (e) => {
              varsList[vIdx].val = e.target.value;
              block.inputs = serializeVariables(varsList);
              syncToTextarea();
              renderSimulator();
            };
            
            delBtn.onclick = () => {
              varsList.splice(vIdx, 1);
              if (varsList.length === 0) {
                varsList.push({ label: 'Cores', val: '16' });
              }
              block.inputs = serializeVariables(varsList);
              syncToTextarea();
              renderVariableRows();
              renderSimulator();
            };
            
            variablesContainer.appendChild(row);
          });
        };
        
        card.querySelector('.add-var-btn').onclick = () => {
          varsList.push({ label: 'NewVar', val: '10' });
          block.inputs = serializeVariables(varsList);
          syncToTextarea();
          renderVariableRows();
          renderSimulator();
        };
        
        const renderSimulator = () => {
          const type = select.value;
          block.calcType = type;
          
          if (type === 'custom') {
            customFieldsDiv.style.display = 'block';
            block.title = customTitleIn.value.trim() || 'Custom Calculator';
            block.formula = customFormulaIn.value.trim() || 'Cores * Factor';
            block.output = customOutputIn.value.trim() || 'Required Licenses: {result}';
            
            previewTitle.textContent = block.title;
            
            let inputsHtml = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
            varsList.forEach(v => {
              inputsHtml += `
                <label style="font-weight:700; font-size:11px; color:var(--muted);">${v.label}<br>
                  <input class="editor-input sim-custom-field" data-var="${v.label.replace(/[^a-zA-Z0-9]/g, '')}" type="number" value="${v.val}" style="margin-top:4px; padding:6px; font-size:12px;">
                </label>
              `;
            });
            inputsHtml += '</div>';
            previewFields.innerHTML = inputsHtml;
            
            const fields = previewFields.querySelectorAll('.sim-custom-field');
            const updateResult = () => {
              const context = {};
              fields.forEach(field => {
                const varName = field.dataset.var;
                context[varName] = +field.value || 0;
              });
              
              let result = 0;
              try {
                const keys = Object.keys(context);
                const vals = Object.values(context);
                const fn = new Function(...keys, `return (${block.formula});`);
                result = fn(...vals);
              } catch(e) {
                result = NaN;
              }
              
              if (isNaN(result)) {
                previewResult.textContent = 'Error in formula';
              } else {
                if (result % 1 !== 0) {
                  result = result.toFixed(2);
                }
                previewResult.textContent = block.output.replace('{result}', result);
              }
            };
            
            fields.forEach(field => {
              field.oninput = updateResult;
            });
            
            updateResult();
            
          } else {
            customFieldsDiv.style.display = 'none';
            if (type === 'oracle') {
              previewTitle.textContent = "Oracle Processor Calculator";
              previewFields.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Cores<br><input class="editor-input sim-core" type="number" value="20" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Core Factor<br><input class="editor-input sim-factor" type="number" value="0.5" step="0.25" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                </div>
              `;
              const coreIn = previewFields.querySelector('.sim-core');
              const factorIn = previewFields.querySelector('.sim-factor');
              const updateResult = () => {
                const c = +coreIn.value || 0;
                const f = +factorIn.value || 0;
                previewResult.textContent = `Required: ${Math.ceil(c * f)} Processor licenses`;
              };
              coreIn.oninput = updateResult;
              factorIn.oninput = updateResult;
              updateResult();
              
            } else if (type === 'ibm') {
              previewTitle.textContent = "IBM PVU Calculator";
              previewFields.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Sockets<br><input class="editor-input sim-sockets" type="number" value="2" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Cores/Socket<br><input class="editor-input sim-cores" type="number" value="8" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">PVU/Core<br><input class="editor-input sim-pvu" type="number" value="70" step="10" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">VM vCPUs<br><input class="editor-input sim-vcpu" type="number" value="4" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                </div>
              `;
              const socketsIn = previewFields.querySelector('.sim-sockets');
              const coresIn = previewFields.querySelector('.sim-cores');
              const pvuIn = previewFields.querySelector('.sim-pvu');
              const vcpuIn = previewFields.querySelector('.sim-vcpu');
              const updateResult = () => {
                const s = +socketsIn.value || 0;
                const c = +coresIn.value || 0;
                const p = +pvuIn.value || 0;
                const v = +vcpuIn.value || 0;
                previewResult.textContent = `Full capacity: ${s*c*p} PVU | Sub-capacity: ${v*p} PVU`;
              };
              socketsIn.oninput = updateResult;
              coresIn.oninput = updateResult;
              pvuIn.oninput = updateResult;
              vcpuIn.oninput = updateResult;
              updateResult();
              
            } else if (type === 'java') {
              previewTitle.textContent = "Java SE Universal Subscription Calculator";
              previewFields.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Employees<br><input class="editor-input sim-emp" type="number" value="1200" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Contractors<br><input class="editor-input sim-cont" type="number" value="300" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                </div>
              `;
              const empIn = previewFields.querySelector('.sim-emp');
              const contIn = previewFields.querySelector('.sim-cont');
              const updateResult = () => {
                const e = +empIn.value || 0;
                const t = +contIn.value || 0;
                const n = e + t;
                let a = 0;
                if (n <= 999) a = 15;
                else if (n <= 2999) a = 12;
                else if (n <= 8999) a = 10.5;
                else if (n <= 19999) a = 8.25;
                else if (n <= 49999) a = 6.75;
                else a = 5.25;
                const r = n * a * 12;
                previewResult.textContent = `Total Users: ${n} | Tier Price: $${a.toFixed(2)}/mo | Annual: $${r.toLocaleString()} / year`;
              };
              empIn.oninput = updateResult;
              contIn.oninput = updateResult;
              updateResult();
              
            } else if (type === 'copilot') {
              previewTitle.textContent = "M365 Copilot Cost & ROI Calculator";
              previewFields.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Seats<br><input class="editor-input sim-seats" type="number" value="500" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Inactive<br><input class="editor-input sim-inactive" type="number" value="150" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                  <label style="font-weight:700; font-size:11px; color:var(--muted);">Hours Saved/User<br><input class="editor-input sim-hours" type="number" value="4" style="margin-top:4px; padding:6px; font-size:12px;"></label>
                </div>
              `;
              const seatsIn = previewFields.querySelector('.sim-seats');
              const inactiveIn = previewFields.querySelector('.sim-inactive');
              const hoursIn = previewFields.querySelector('.sim-hours');
              const updateResult = () => {
                const e = +seatsIn.value || 0;
                const t = +inactiveIn.value || 0;
                const n = +hoursIn.value || 0;
                const a = 360 * e;
                const r = 360 * t;
                const c = Math.max(0, e - t);
                const i = 50 * n;
                const s = 12 * c * i;
                const o = s - a;
                previewResult.textContent = `Spend: $${a.toLocaleString()} | Waste: $${r.toLocaleString()} | Benefit: $${o.toLocaleString()}/year`;
              };
              seatsIn.oninput = updateResult;
              inactiveIn.oninput = updateResult;
              hoursIn.oninput = updateResult;
              updateResult();
            }
          }
          syncToTextarea();
        };
        
        select.onchange = () => {
          if (select.value === 'custom') {
            block.calcType = 'custom';
            block.title = block.title || 'Custom Calculator';
            block.formula = block.formula || 'Cores * Factor';
            block.output = block.output || 'Required Licenses: {result} Cores';
            block.inputs = block.inputs || 'Cores:16|Factor:0.5';
            
            customTitleIn.value = block.title;
            customFormulaIn.value = block.formula;
            customOutputIn.value = block.output;
            varsList = parseVariables(block.inputs);
          }
          renderVariableRows();
          renderSimulator();
        };
        
        const onCustomFieldInput = () => {
          if (select.value === 'custom') {
            block.title = customTitleIn.value.trim() || 'Custom Calculator';
            block.formula = customFormulaIn.value.trim() || 'Cores * Factor';
            block.output = customOutputIn.value.trim() || 'Required Licenses: {result}';
            renderSimulator();
          }
        };
        
        customTitleIn.oninput = onCustomFieldInput;
        customFormulaIn.oninput = onCustomFieldInput;
        customOutputIn.oninput = onCustomFieldInput;
        
        renderVariableRows();
        renderSimulator();
      } else if (block.type === 'excel') {
        const presetSelect = card.querySelector('.excel-preset-select');
        const customDiv = card.querySelector('.custom-excel-fields');
        const titleEl = card.querySelector('.excel-title');
        const sizeEl = card.querySelector('.excel-size');
        const sheetsEl = card.querySelector('.excel-sheets');
        const linkEl = card.querySelector('.excel-link');
        
        const previewTitle = card.querySelector('.excel-preview-title');
        const previewSheets = card.querySelector('.excel-preview-sheets');
        const previewSize = card.querySelector('.excel-preview-size');
        
        const fileInput = card.querySelector('.excel-file-upload-input');
        const uploadStatus = card.querySelector('.excel-upload-status');
        
        const toggleFields = () => {
          if (presetSelect.value === 'custom') {
            customDiv.style.display = 'block';
          } else {
            customDiv.style.display = 'none';
          }
        };
        
        const updateExcelFromPreset = () => {
          const val = presetSelect.value;
          block.preset = val;
          if (val === 'oracle') {
            block.title = "Oracle SAM ELP Workbook";
            block.size = "37.3 KB";
            block.sheets = "13 sheets";
            block.link = "../assets/Oracle_SAM_ELP_Workbook.xlsx";
          } else if (val === 'ibm') {
            block.title = "IBM SAM ELP Workbook";
            block.size = "38.8 KB";
            block.sheets = "11 sheets";
            block.link = "../assets/IBM_SAM_ELP_Workbook.xlsx";
          } else if (val === 'microsoft') {
            block.title = "Microsoft SAM ELP Workbook";
            block.size = "37.4 KB";
            block.sheets = "12 sheets";
            block.link = "../assets/Microsoft_SAM_ELP_Workbook.xlsx";
          } else {
            block.title = titleEl.value.trim() || 'Custom SAM Workbook';
            block.size = sizeEl.value.trim() || '24 KB';
            block.sheets = sheetsEl.value.trim() || '5 sheets';
            block.link = linkEl.value.trim() || '../assets/Workbook.xlsx';
          }
          
          previewTitle.textContent = block.title;
          previewSheets.textContent = block.sheets;
          previewSize.textContent = block.size;
          
          syncToTextarea();
        };
        
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target.result;
            
            let formattedSize = '';
            if (file.size < 1024) formattedSize = `${file.size} B`;
            else if (file.size < 1024 * 1024) formattedSize = `${(file.size / 1024).toFixed(1)} KB`;
            else formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
            
            block.title = file.name.replace(/\.[^/.]+$/, "");
            block.size = formattedSize;
            block.sheets = "1 sheet";
            block.link = base64Data;
            
            titleEl.value = block.title;
            sizeEl.value = block.size;
            sheetsEl.value = block.sheets;
            linkEl.value = block.link;
            
            previewTitle.textContent = block.title;
            previewSheets.textContent = block.sheets;
            previewSize.textContent = block.size;
            
            uploadStatus.textContent = `✅ Successfully uploaded: ${file.name} (${formattedSize})`;
            uploadStatus.style.display = 'block';
            
            syncToTextarea();
          };
          reader.readAsDataURL(file);
        };
        
        presetSelect.onchange = () => {
          toggleFields();
          updateExcelFromPreset();
        };
        
        const onCustomInput = () => {
          if (presetSelect.value === 'custom') {
            block.title = titleEl.value.trim() || 'Custom SAM Workbook';
            block.size = sizeEl.value.trim() || '24 KB';
            block.sheets = sheetsEl.value.trim() || '5 sheets';
            block.link = linkEl.value.trim() || '../assets/Workbook.xlsx';
            
            previewTitle.textContent = block.title;
            previewSheets.textContent = block.sheets;
            previewSize.textContent = block.size;
            
            syncToTextarea();
          }
        };
        
        titleEl.oninput = onCustomInput;
        sizeEl.oninput = onCustomInput;
        sheetsEl.oninput = onCustomInput;
        linkEl.oninput = onCustomInput;
        
        toggleFields();
        updateExcelFromPreset();
      } else if (block.type === 'table') {
        let grid = parseTable(block.value || '');
        
        card.querySelectorAll('.table-cell-input').forEach(input => {
          input.oninput = (e) => {
            const r = +e.target.dataset.row;
            const c = +e.target.dataset.col;
            grid[r][c] = e.target.value;
            block.value = serializeTable(grid);
            syncToTextarea();
          };
        });
        
        card.querySelector('.add-row-btn').onclick = () => {
          const numCols = grid[0].length;
          const newRow = Array(numCols).fill('New cell');
          grid.push(newRow);
          block.value = serializeTable(grid);
          syncToTextarea();
          renderBlocks();
        };
        
        card.querySelector('.add-col-btn').onclick = () => {
          grid.forEach(row => row.push('New col'));
          block.value = serializeTable(grid);
          syncToTextarea();
          renderBlocks();
        };
        
        card.querySelector('.del-row-btn').onclick = () => {
          if (grid.length <= 2) {
            alert("Table must have at least a header and one data row.");
            return;
          }
          grid.pop();
          block.value = serializeTable(grid);
          syncToTextarea();
          renderBlocks();
        };
        
        card.querySelector('.del-col-btn').onclick = () => {
          if (grid[0].length <= 1) {
            alert("Table must have at least one column.");
            return;
          }
          grid.forEach(row => row.pop());
          block.value = serializeTable(grid);
          syncToTextarea();
          renderBlocks();
        };
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
        newBlock.preset = 'oracle';
        newBlock.title = 'Oracle SAM ELP Workbook';
        newBlock.size = '37.3 KB';
        newBlock.sheets = '13 sheets';
        newBlock.link = '../assets/Oracle_SAM_ELP_Workbook.xlsx';
      } else if (type === 'table') {
        newBlock.value = `| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |`;
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
        
        // Render and evaluate any custom calculators inside the preview container
        if (typeof window.initializeCustomCalculators === 'function') {
          window.initializeCustomCalculators(previewContainer);
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
  
  // Initialize any custom calculators
  if (typeof window.initializeCustomCalculators === 'function') {
    window.initializeCustomCalculators();
  }
})
