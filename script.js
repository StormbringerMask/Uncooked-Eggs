document.getElementById('startBtn').addEventListener('click', () => {
  document.querySelector('.intro').style.display = 'none';
  document.querySelector('.graph-container').style.overflowY = 'scroll';
  loadAndRenderData();
});

function loadAndRenderData() {
  Papa.parse("vision_data.csv", {
    download: true,
    header: true,
    complete: function(results) {
      const data = results.data;
      const fontSizes = [...new Set(data.map(row => row["Font Size (pt)"]))].sort((a, b) => parseInt(a) - parseInt(b));
      const users = [...new Set(data.map(row => row["Username"]))];

      const container = document.getElementById('graphContainer');

      // 1. Bar Graphs
      fontSizes.forEach((font, i) => {
        const section = createGraphSection();
        const ctx = createCanvas(section);

        const averages = users.map(user => {
          const userData = data.filter(row => row["Username"] === user && row["Font Size (pt)"] === font);
          const times = userData.map(row => parseFloat(row["Elapsed Time (s)"]));
          const avg = times.reduce((a, b) => a + b, 0) / times.length || 0;
          return avg;
        });

        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: users,
            datasets: [{
              label: `Average Time (s) - Font ${font}pt`,
              data: averages,
              backgroundColor: 'steelblue'
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } }
          }
        });

        container.appendChild(section);
      });

      // 2. Line Graphs
      fontSizes.forEach((font, i) => {
        if (font === "12") return;

        const section = createGraphSection();
        const ctx = createCanvas(section);

        const pctChanges = users.map(user => {
          const baseData = data.filter(row => row["Username"] === user && row["Font Size (pt)"] === "12");
          const compData = data.filter(row => row["Username"] === user && row["Font Size (pt)"] === font);

          const baseAvg = avg(baseData.map(row => parseFloat(row["Elapsed Time (s)"])));
          const compAvg = avg(compData.map(row => parseFloat(row["Elapsed Time (s)"])));

          const pctChange = ((compAvg - baseAvg) / baseAvg) * 100;
          return pctChange;
        });

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: users,
            datasets: [{
              label: `% Change from 12pt to ${font}pt`,
              data: pctChanges,
              borderColor: 'crimson',
              fill: false,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => `${ctx.parsed.y.toFixed(1)}%`
                }
              }
            },
            scales: {
              y: {
                title: { display: true, text: '% Change' },
                ticks: {
                  callback: val => `${val}%`
                }
              }
            }
          }
        });

        container.appendChild(section);
      });

      revealOnScroll();
    }
  });
}

function createGraphSection() {
  const section = document.createElement('div');
  section.className = 'graph-section';
  return section;
}

function createCanvas(container) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  return canvas;
}

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function revealOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.5
  });

  document.querySelectorAll('.graph-section').forEach(section => {
    observer.observe(section);
  });
}