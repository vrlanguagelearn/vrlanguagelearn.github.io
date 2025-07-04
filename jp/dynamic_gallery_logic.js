

window.goToInputPage = function () {
  const input = document.getElementById('goToPageInput');
  const page = parseInt(input.value, 10);
  const totalPages = window.filteredData ? Math.ceil(window.filteredData.length / window.itemsPerPage) : 0;
  if (!isNaN(page) && page >= 1 && page <= totalPages) {
    goToPage(page);
  } else {
    alert('Please enter a valid page number between 1 and ' + totalPages);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof galleryData !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      document.getElementById('searchInput').value = searchParam;
    }
    initGallery(searchParam);
  }
});

function initGallery(preloadedSearch) {
  const itemsPerPage = 45;
  let currentPage = 1;
  let searchTerm = preloadedSearch ? preloadedSearch.toLowerCase() : "";
  let selectedLinks = new Set();
  window.selectedLinks = selectedLinks;
  let filteredData = [...galleryData];

  function encodeSafeId(val) {
    return btoa(unescape(encodeURIComponent(val))).replace(/[^\w]/g, '');
  }

  function createFilters() {
    const groups = ['actress', 'director', 'maker', 'series', 'label', 'keyword'];
    const sets = Object.fromEntries(groups.map(group => [group, new Set()]));

    galleryData.forEach(item => {
      groups.forEach(group => {
        (item[group] || []).forEach(value => sets[group].add(value));
      });
    });

    groups.forEach(group => {
      const container = document.getElementById(`filter${group[0].toUpperCase() + group.slice(1)}Body`);
      if (container) {
        container.innerHTML = [...sets[group]].sort().map(val => {
          const id = `chk-${group}-${encodeSafeId(val)}`;
          return `
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="${val}" data-group="${group}" id="${id}">
              <label class="form-check-label" for="${id}">${val}</label>
            </div>`;
        }).join('');
      }
    });
  }

  function renderGalleryPage(page) {
  window.currentPage = page;
  window.currentPage = page;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const grid = document.getElementById('galleryGrid');
    const base = window.location.pathname.split('/').pop() || "index.html";

    grid.innerHTML = filteredData.slice(start, end).map((item, index) => {
      const id = `item-${item.id}-${index}`;
      const searchLinks = item.actress.map(name =>
        `<a href="${base}?search=${encodeURIComponent(name)}" target="_blank">${name}</a>`
      ).join(', ');

      return `
        <div class="col-md-4 mb-4">
          <div class="card h-100 ${selectedLinks.has(item.seed_download_link) ? 'selected-card' : ''}">
            <img src="${item.preview_img_url}" class="card-img-top" alt="${item.title}">
            <div class="card-body d-flex flex-column">
              <div class="d-flex align-items-start gap-2 mb-2">
                <input class="form-check-input select-item"
                       style="width:1.2em;height:1.2em;border-radius:0.25em;flex-shrink:0;margin-top:0.25em;"
                       type="checkbox"
                       value="${item.seed_download_link}" id="${id}" ${selectedLinks.has(item.seed_download_link) ? 'checked' : ''}>
                <label for="${id}" class="fw-semibold text-dark title-clamp" style="cursor: pointer;">
                  ${item.title}
                </label>
              </div>
              <small class="text-muted">${item.sell_date} | Size: ${item.size} | Duration: ${item.duration}</small>
              <p><strong>Actress:</strong> ${searchLinks}</p>
              <button class="btn btn-outline-primary btn-sm mt-2" onclick="copyMagnet(\'${item.seed_download_link}\', this)">Copy Magnet Link</button>
            </div>
          </div>
        </div>`;
    }).join('');

    updateItemCount();
    monitorSelection();
    renderPagination();
  }

  function updateItemCount() {
    const count = selectedLinks.size;
    const btn = document.getElementById('exportBtn');
    const itemCount = document.getElementById('itemCount');
  if (itemCount) {
    itemCount.innerText = filteredData.length === galleryData.length
      ? `Total: ${galleryData.length} items`
      : `Filtering: ${filteredData.length} / Total: ${galleryData.length} items`;
      };
    btn.innerText = `Export (${count})`;
    btn.style.display = count > 0 ? 'block' : 'none';
  }

  function monitorSelection() {
    document.querySelectorAll('.select-item').forEach(cb => {
      const link = cb.value;
      const card = cb.closest('.card');
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selectedLinks.add(link);
          card.classList.add('selected-card');
        } else {
          selectedLinks.delete(link);
          card.classList.remove('selected-card');
        }
        updateItemCount();
      });
    });
  }

  function parseSizeGB(sizeStr) {
    try {
      return parseFloat(sizeStr.replace(/[^\d.]/g, ''));
    } catch {
      return 0;
    }
  }

  
function applyFilters() {
  const checked = Array.from(document.querySelectorAll('.form-check-input:checked'));
  const active = { actress: [], director: [], maker: [], series: [], label: [], keyword: [] };

  checked.forEach(cb => {
    if (cb.dataset.group) {
      active[cb.dataset.group].push(cb.value);
    }
  });

  const minInput = document.getElementById('minSizeInput');
  const maxInput = document.getElementById('maxSizeInput');
  const minSize = parseFloat(minInput ? minInput.value : "");
  const maxSize = parseFloat(maxInput ? maxInput.value : "");

  filteredData = galleryData.filter(item => {
    const match = Object.keys(active).every(group =>
      active[group].length === 0 || active[group].some(v => item[group]?.includes(v))
    );

    const matchSearch = !searchTerm ||
      item.title.toLowerCase().includes(searchTerm) ||
      (item.actress && item.actress.some(a => a.toLowerCase().includes(searchTerm)));

    const sizeGB = parseSizeGB(item.size);
    const matchMin = isNaN(minSize) || sizeGB >= minSize;
    const matchMax = isNaN(maxSize) || sizeGB <= maxSize;

    return match && matchSearch && matchMin && matchMax;
  });

  window.filteredData = filteredData;
  renderGalleryPage(1);

  }

  

window.goToPage = function(page) {
  const spinner = document.getElementById('loadingSpinner');
  const overlay = document.getElementById('loadingOverlay');
  if (spinner) spinner.style.display = 'block';
  if (overlay) overlay.style.display = 'block';

  

  setTimeout(() => {

    currentPage = page;
    renderGalleryPage(currentPage);
    

    
    
    const galleryPane = document.querySelector('div.content');
    if (galleryPane) galleryPane.scrollTo({ top: 0, behavior: 'instant' });
if (spinner) if (spinner) spinner.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  }, 1000);
};


  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    applyFilters();
  });

  document.getElementById('filterAccordion').addEventListener('change', (e) => {
    if (e.target.classList.contains('form-check-input')) applyFilters();
  });

  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.querySelectorAll('.form-check-input:checked').forEach(cb => cb.checked = false);
    document.getElementById('searchInput').value = '';
    const minInput = document.getElementById('minSizeInput');
    if (minInput) minInput.value = '';
    const maxInput = document.getElementById('maxSizeInput');
    if (maxInput) maxInput.value = '';
    searchTerm = "";
    applyFilters();
  });

  window.filteredData = filteredData;
  window.itemsPerPage = itemsPerPage;
  window.currentPage = 1;

  createFilters();
  applyFilters();
};



window.goToInputPage = function () {
  const input = document.getElementById('goToPageInput');
  const page = parseInt(input.value, 10);
  const totalPages = window.filteredData ? Math.ceil(window.filteredData.length / window.itemsPerPage) : 0;
  if (!isNaN(page) && page >= 1 && page <= totalPages) {
    goToPage(page);
  } else {
    alert('Please enter a valid page number between 1 and ' + totalPages);
  }
};

function renderPagination() {
  const paginationContainer = document.getElementById('paginationControls');
  if (!paginationContainer || !window.filteredData) return;

  const totalPages = Math.ceil(window.filteredData.length / window.itemsPerPage);
  const isMobile = window.innerWidth <= 768;
  let buttonsHTML = '';
  const current = window.currentPage || 1;

  const addPageButton = (page, label = null, active = false, disabled = false) => {
    return `
      <li class="page-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''} mx-1">
        <a class="page-link" style="border-radius: 0.375rem;" href="javascript:void(0);" onclick="goToPage(${page})">
          ${label || page}
        </a>
      </li>`;
  };

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  
  
  if (isMobile) {
    const bufferPages = [current - 1, current, current + 1].filter(
      p => p > 1 && p < totalPages
    );

    buttonsHTML += addPageButton(1, '1', current === 1);

    if (bufferPages.length > 0 && bufferPages[0] > 2) {
      buttonsHTML += '<li class="page-item disabled mx-1"><span class="page-link">...</span></li>';
    }

    for (const p of bufferPages) {
      buttonsHTML += addPageButton(p, null, p === current);
    }

    if (bufferPages.length > 0 && bufferPages[bufferPages.length - 1] < totalPages - 1) {
      buttonsHTML += '<li class="page-item disabled mx-1"><span class="page-link">...</span></li>';
    }

    if (totalPages > 1) {
      buttonsHTML += addPageButton(totalPages, totalPages.toString(), current === totalPages);
    }
  }

  else {
    const maxVisiblePages = 10;
    const firstPage = 1;
    const lastPage = totalPages;
    const startPage = Math.max(Math.min(current - 4, totalPages - 10), 2);
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages - 1);

    buttonsHTML += addPageButton(current > 1 ? current - 1 : 1, '&laquo;', false);
    buttonsHTML += addPageButton(firstPage, '1', current === 1);

    if (startPage > 2) {
      buttonsHTML += '<li class="page-item disabled mx-1"><span class="page-link">...</span></li>';
    }

    for (let i = startPage; i <= endPage; i++) {
      buttonsHTML += addPageButton(i, null, current === i);
    }

    if (endPage < totalPages - 1) {
      buttonsHTML += '<li class="page-item disabled mx-1"><span class="page-link">...</span></li>';
    }

    buttonsHTML += addPageButton(lastPage, totalPages.toString(), current === totalPages);
    buttonsHTML += addPageButton(current < lastPage ? current + 1 : lastPage, '&raquo;', false);
  }

  const goToBoxHTML = `
    <div class="d-flex justify-content-center align-items-center mt-2 mt-md-0" style="gap: 0.5rem; flex-wrap: wrap;">
      <input type="number" id="goToPageInput" min="1" max="${totalPages}" class="form-control form-control-sm" style="width: 80px;" placeholder="Page #">
      <button class="btn btn-sm btn-outline-secondary" onclick="goToInputPage()">Go</button>
    </div>`;

  paginationContainer.innerHTML = `
    <div class="d-flex flex-column flex-md-row justify-content-center align-items-center gap-2">
      <ul class="pagination pagination-sm mb-0 flex-wrap justify-content-center">
        ${buttonsHTML}
      </ul>
      ${goToBoxHTML}
    </div>
  `;
}


function copyMagnet(magnetLink, button) {
  navigator.clipboard.writeText(magnetLink).then(() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.innerText = 'Magnet link copied';
    button.parentElement.appendChild(tooltip);

    setTimeout(() => {
      tooltip.remove();
    }, 1000);
  });
}



function showExportMenu(button) {
  const existing = document.getElementById('exportMenu');
  if (existing) {
    existing.remove();
    return;
  }

  const menu = document.createElement('div');
  menu.id = 'exportMenu';
  menu.style.position = 'absolute';
  menu.style.top = (button.offsetTop + button.offsetHeight + 5) + 'px';
  menu.style.right = '20px';
  menu.style.background = '#fff';
  menu.style.border = '1px solid #ccc';
  menu.style.padding = '5px 0';
  menu.style.zIndex = 10000;
  menu.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  menu.style.borderRadius = '4px';
  menu.style.fontSize = '0.9rem';

  const copyItem = document.createElement('div');
  copyItem.innerText = 'Copy links';
  copyItem.style.padding = '6px 15px';
  copyItem.style.cursor = 'pointer';
  copyItem.onclick = () => {
    const linksArray = Array.from(window.selectedLinks || []);
    const text = linksArray.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showExportTooltip('Magnet links copied');
    });
    menu.remove();
  };

  const downloadItem = document.createElement('div');
  downloadItem.innerText = 'Download file';
  downloadItem.style.padding = '6px 15px';
  downloadItem.style.cursor = 'pointer';
  downloadItem.onclick = () => {
    const linksArray = Array.from(window.selectedLinks || []);
    const blob = new Blob([linksArray.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seeds.txt';
    a.click();
    URL.revokeObjectURL(url);
    menu.remove();
  };

  menu.appendChild(copyItem);
  menu.appendChild(downloadItem);
  button.parentElement.appendChild(menu);
}

function showTooltip(button, text) {
  const tooltip = document.createElement('div');
  tooltip.className = 'copy-tooltip';
  tooltip.innerText = text;

  const rect = button.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  tooltip.style.position = 'absolute';
  tooltip.style.top = (rect.top + scrollTop - 35) + 'px';
  tooltip.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
  tooltip.style.transform = 'translateX(-50%)';
  tooltip.style.zIndex = 10001;

  document.body.appendChild(tooltip);
  setTimeout(() => tooltip.remove(), 1000);
}


function showExportTooltip(text) {
  const tooltip = document.createElement('div');
  tooltip.className = 'copy-export-tooltip';
  tooltip.innerText = text;

  tooltip.style.position = 'fixed';
  tooltip.style.top = '90px';
  tooltip.style.left = '50%';
  tooltip.style.transform = 'translateX(-50%)';
  tooltip.style.zIndex = 10001;

  document.body.appendChild(tooltip);
  setTimeout(() => tooltip.remove(), 1000);
}