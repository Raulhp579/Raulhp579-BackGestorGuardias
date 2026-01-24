// src/fullcalendarStyles.js
export function loadFullCalendarCss() {
    const urls = [
      new URL("../node_modules/@fullcalendar/core/index.css", import.meta.url).href,
      new URL("../node_modules/@fullcalendar/daygrid/index.css", import.meta.url).href,
  
      // activa solo si los usas:
      // new URL("../node_modules/@fullcalendar/timegrid/index.css", import.meta.url).href,
      // new URL("../node_modules/@fullcalendar/list/index.css", import.meta.url).href,
    ];
  
    urls.forEach((href) => {
      if (document.querySelector(`link[data-fc-css="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-fc-css", href);
      document.head.appendChild(link);
    });
  }