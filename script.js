document.getElementById("getStarted").addEventListener("click", () => {
  document.getElementById("splash").style.display = "none";
  document.getElementById("mainContent").classList.remove("hidden");
  loadAndRenderCharts();
});

function loadAndRenderCharts() {
  Papa.parse("vision_data.csv", {
    download: true,
    header: true,
    complete: (results) => {
      const data = results.data;
      generateCharts(data);
    }
  });
}

function generateCharts(data) {
  const chartsContainer = document.getElementById("chartsContainer");
  const users = [...new Set(data.map(row => row["Username"]))];
  const fontSizes = [...new Set(data.map(row => row["Font Size (pt)"]))].sort((a, b) => a - b);

  const userFontTimes = {};
  users.forEach(user => {
    userFontTimes[user] = {};
    fontSizes.forEach(font => {
      const times = data
        .filter(row => row["Username"] === user && row["Font Size (pt)"] === font)
        .map(row => parseFloat(row["Elapsed Time (s)"]));
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      userFontTimes[user][font] = avg;
    });
  });

  // Graph 1: Bar Graph – Avg Times by User per Font Size
  const barData = {
    labels: fontSizes,
    datasets: users.map((user, i) => ({
      label: user,
      data: fontSizes.map(f => userFontTimes[user][f]),
      backgroundColor: `hsl(${i * 60}, 70%, 50%)`
    }))
  };

  createChart("Average Time by Font Size and User", "bar", barData, chartsContainer);

  // Graph 2: Line Graph – % Change from 12pt
  const baseFont = "12";
  const lineData = {
    labels: fontSizes,
    datasets: users.map((user, i) => {
      const base = userFontTimes[user][baseFont];
      return {
        label: user,
        data: fontSizes.map(f => {
          const v = userFontTimes[user][f];
          return base ? ((v - base) / base * 100).toFixed(2) : 0;
        }),
        fill: false,
        borderColor: `hsl(${i * 60}, 80%, 60%)`,
        tension: 0.3
      };
    })
  };

  createChart("Percentage Change from 12pt", "line", lineData, chartsContainer);
}

function createChart(title, type, data, container) {
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  new Chart(ctx, {
    type: type,
    data: data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title,
          color: "#fff",
          font: { size: 20 }
        },
        legend: {
          labels: {
            color: "#fff"
          }
        }
      },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      }
    }
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        canvas.classList.add("fade-in");
        observer.unobserve(canvas);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(canvas);
}
