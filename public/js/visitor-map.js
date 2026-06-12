(function() {
  function latLngToSvg(lat, lng) {
    var x = (lng + 180) * (800 / 360);
    var latRad = lat * Math.PI / 180;
    var mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    var y = 200 - (mercN * 800 / (2 * Math.PI)) * 0.8;
    return { x: Math.max(0, Math.min(800, x)), y: Math.max(0, Math.min(400, y)) };
  }
  var svg = document.getElementById("visitor-map");
  var dotsGroup = document.getElementById("visitor-dots");
  var tooltip = document.getElementById("visitor-tooltip");

  fetch("https://visitormap.alan-squirrel-acc.workers.dev/all")
    .then(function(r) { return r.json(); })
    .then(function(visitors) {
      visitors.forEach(function(v) {
        var pos = latLngToSvg(v.lat, v.lng);
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", pos.x);
        circle.setAttribute("cy", pos.y);
        circle.setAttribute("r", 5);
        circle.setAttribute("class", "visitor-dot");
        circle.addEventListener("mouseenter", function(e) {
          tooltip.textContent = v.city + ", " + v.country;
          tooltip.style.display = "block";
          var rect = svg.getBoundingClientRect();
          tooltip.style.left = (e.clientX - rect.left + 10) + "px";
          tooltip.style.top = (e.clientY - rect.top - 20) + "px";
        });
        circle.addEventListener("mouseleave", function() {
          tooltip.style.display = "none";
        });
        dotsGroup.appendChild(circle);
      });
    })
    .catch(function(err) { console.error("Visitor map error:", err); });
})();
