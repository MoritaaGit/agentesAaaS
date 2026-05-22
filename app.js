document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navLinks = document.querySelectorAll('.nav-link');
  const tabContents = document.querySelectorAll('.tab-content');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active from all links and tabs
      navLinks.forEach(l => l.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));
      
      // Add active to clicked link
      link.classList.add('active');
      
      // Get target tab id
      const targetTabId = link.getAttribute('data-tab');
      const targetTab = document.getElementById(targetTabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }
      
      // Trigger tab-specific initiations
      if (targetTabId === 'tab-dashboard') {
        animateStats();
      }
    });
  });

  // Dynamic Iframe Management
  const appScriptInput = document.getElementById('script-url-input');
  const agentIdInput = document.getElementById('agent-id-input');
  const refreshIframeBtn = document.getElementById('refresh-iframe-btn');
  const mainIframe = document.getElementById('main-iframe');
  const iframeOverlay = document.querySelector('.iframe-loading-overlay');
  
  function updateIframeSrc() {
    const baseUrl = appScriptInput.value.trim();
    const agentId = agentIdInput.value.trim();
    
    if (!baseUrl) return;
    
    // Show loading overlay
    iframeOverlay.style.opacity = '1';
    iframeOverlay.style.pointerEvents = 'all';
    
    // Construct final URL
    let finalUrl = baseUrl;
    // Check if a= is already present or need to add/replace
    if (finalUrl.includes('?')) {
      if (finalUrl.includes('a=')) {
        finalUrl = finalUrl.replace(/a=\d+/, `a=${agentId}`);
      } else {
        finalUrl = `${finalUrl}&a=${agentId}`;
      }
    } else {
      finalUrl = `${finalUrl}?a=${agentId}`;
    }
    
    console.log('Loading Apps Script URL:', finalUrl);
    mainIframe.src = finalUrl;
  }
  
  // When Iframe is loaded
  if (mainIframe) {
    mainIframe.addEventListener('load', () => {
      // Fade out loading overlay
      iframeOverlay.style.opacity = '0';
      iframeOverlay.style.pointerEvents = 'none';
    });
  }
  
  if (refreshIframeBtn) {
    refreshIframeBtn.addEventListener('click', updateIframeSrc);
  }
  
  // Also update when pressing Enter in input fields
  [appScriptInput, agentIdInput].forEach(input => {
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          updateIframeSrc();
        }
      });
    }
  });

  // Simulated Stats Animation
  function animateStats() {
    const counters = document.querySelectorAll('.counter-val');
    
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      const speed = 60; // smaller = faster
      const increment = target / speed;
      
      let currentVal = 0;
      
      const updateCount = () => {
        currentVal += increment;
        if (currentVal < target) {
          if (counter.classList.contains('float-val')) {
            counter.innerText = currentVal.toFixed(1);
          } else {
            counter.innerText = Math.ceil(currentVal).toLocaleString();
          }
          setTimeout(updateCount, 15);
        } else {
          if (counter.classList.contains('float-val')) {
            counter.innerText = target.toFixed(1);
          } else {
            counter.innerText = target.toLocaleString();
          }
        }
      };
      
      updateCount();
    });
  }
  
  // Initial run on dashboard load
  animateStats();
  
  // Periodic slight fluctuations on latency and requests
  setInterval(() => {
    const latencyEl = document.querySelector('.latency-val');
    const reqEl = document.querySelector('.requests-val');
    
    if (latencyEl) {
      const currentLatency = parseFloat(latencyEl.innerText);
      const fluctuation = (Math.random() * 40 - 20); // -20ms to +20ms
      const newVal = Math.max(120, Math.min(450, currentLatency + fluctuation));
      latencyEl.innerText = Math.round(newVal);
    }
    
    if (reqEl) {
      const currentReq = parseInt(reqEl.innerText.replace(/,/g, ''));
      const increment = Math.floor(Math.random() * 3) + 1; // +1 to +3
      reqEl.innerText = (currentReq + increment).toLocaleString();
    }
  }, 5000);

  // Flow Diagram Node Clicks (Interactions)
  const nodes = document.querySelectorAll('.node');
  const detailsBox = document.getElementById('diagram-flow-details');
  
  const nodeDescriptions = {
    'node-hub': {
      title: 'Hub de Control (Homero.v5)',
      desc: 'El cerebro central del sistema. Aloja la memoria del agente, los registros de procesamiento de patentes, las configuraciones globales de los Spokes y enruta los prompts. Almacena de forma ordenada qué Spoke realiza cada consulta y recopila las respuestas estructuradas.'
    },
    'node-ui': {
      title: 'Interfaz Universal (Apps Script)',
      desc: 'El Web App de Apps Script que actúa como capa intermedia (Middleware). Traduce las interacciones del front-end en funciones ejecutables dentro de Google Workspace, lee las configuraciones del Hub y genera el renderizado dinámico de la consola.'
    },
    'node-spoke-1': {
      title: 'Spoke Patentes (SPOKES.v4)',
      desc: 'El conector periférico especializado en patentes. Realiza búsquedas semánticas, extrae clasificaciones de patentes internacionales, analiza resúmenes de patentes y estructura la información clave en la hoja de cálculo del Spoke antes de sincronizarla al Hub.'
    },
    'node-spoke-2': {
      title: 'Spoke Análisis Técnico',
      desc: 'Módulo satélite para procesar informes de invención y resúmenes de solicitudes. Toma las especificaciones técnicas del Hub y genera informes técnicos estructurados listos para ser presentados ante organismos de patentes.'
    },
    'node-spoke-3': {
      title: 'Spoke Vigilancia Tecnológica',
      desc: 'Sondea automáticamente repositorios públicos de patentes a través de APIs de propiedad intelectual, identificando tendencias tecnológicas y competidores clave para luego catalogar los hallazgos en la arquitectura distribuida.'
    }
  };
  
  nodes.forEach(node => {
    node.addEventListener('click', () => {
      const nodeId = node.id;
      const data = nodeDescriptions[nodeId];
      
      if (data && detailsBox) {
        // Highlight active node in SVG
        nodes.forEach(n => {
          const circle = n.querySelector('circle') || n.querySelector('rect');
          if (circle) {
            circle.style.strokeWidth = '2px';
            if (n.id === 'node-hub') circle.style.stroke = 'var(--color-secondary)';
            else if (n.id === 'node-ui') circle.style.stroke = 'var(--color-primary)';
            else circle.style.stroke = 'var(--color-accent)';
          }
        });
        
        const activeCircle = node.querySelector('circle') || node.querySelector('rect');
        if (activeCircle) {
          activeCircle.style.strokeWidth = '4px';
          activeCircle.style.stroke = '#fff';
        }
        
        // Update detail panel text
        detailsBox.innerHTML = `
          <div class="stat-icon" style="margin-bottom: 0.5rem; color: ${nodeId.includes('hub') ? 'var(--color-secondary)' : nodeId.includes('ui') ? 'var(--color-primary)' : 'var(--color-accent)'}">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h4 style="font-size: 1rem; color: #fff; margin-bottom: 0.35rem; font-family: var(--font-title);">${data.title}</h4>
          <p style="font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.45;">${data.desc}</p>
        `;
        
        detailsBox.style.animation = 'none';
        detailsBox.offsetHeight; // trigger reflow
        detailsBox.style.animation = 'fadeIn 0.3s ease-out forwards';
      }
    });
  });

  // Elevation Guide Accordion
  const accordionHeaders = document.querySelectorAll('.guide-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const step = header.closest('.guide-step');
      const isExpanded = step.classList.contains('expanded');
      
      // Collapse all steps
      document.querySelectorAll('.guide-step').forEach(s => {
        s.classList.remove('expanded');
      });
      
      // Expand clicked step if it wasn't already expanded
      if (!isExpanded) {
        step.classList.add('expanded');
      }
    });
  });
  
  // Set up the first accordion step to be expanded by default
  const firstStep = document.querySelector('.guide-step');
  if (firstStep) {
    firstStep.classList.add('expanded');
  }
  
  // Trigger first load of the iframe on start
  updateIframeSrc();
});
