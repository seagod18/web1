function createSpark() {
    const spark = document.createElement("div");
    spark.classList.add("sparks");

    // Random position around the text
    let offsetX = (Math.random() - 0.5) * 200;
    let offsetY = (Math.random() - 0.5) * 50;

    spark.style.left = `calc(50% + ${offsetX}px)`;
    spark.style.top = `calc(50% + ${offsetY}px)`;
    spark.style.opacity = 1;

    document.body.appendChild(spark);

    setTimeout(() => {
        spark.style.opacity = 0;
        spark.remove();
    }, 200); // Sparks fade out
}

// Generate sparks at random intervals
setInterval(() => {
    if (Math.random() > 0.7) createSpark();
}, 300);
