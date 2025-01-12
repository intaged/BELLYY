const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const faceImage = new Image();
faceImage.src = './orangie.png'; // Changed from .jpeg to .png

class Character {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2 + 70;
        this.bellySize = 30;
        this.maxBellySize = 80;
        this.isExploded = false;
        this.inflationRate = 1.0;
        this.isHovering = false;
        this.initialBellySize = 30;
        this.chatOpacity = 0;
        this.guideTextBounce = 0;
        this.lastGuideTextBounceTime = 0;
        this.guideTextOpacity = 1;
        this.lastFadeTime = 0;
        this.currentMessage = "";
        this.targetMessage = "";
        this.messageChangeTime = 0;
        this.bubbleScale = 1;
        this.bubbleRotation = 0;
        this.isAnimatingExplosion = false;
        this.clickEffects = [];
        this.inflationTexts = ['🎈', '💨', '💢', '💫', '⭐'];
        this.shakeIntensity = 0;
        this.backgroundOffset = { x: 0, y: 0 };
        this.shakeOffset = { x: 0, y: 0 };
        this.lastShakeTime = 0;
        this.progressBarHeight = 4;
        this.progressBarPadding = 20;
        this.progressBarY = 15;
        this.deathScreen = null;
        this.restartButton = null;
        this.progressBar = document.querySelector('.progress-bar');
        this.progressPercentage = document.querySelector('.progress-percentage');
        
        document.addEventListener('DOMContentLoaded', () => {
            this.deathScreen = document.getElementById('deathScreen');
            this.restartButton = document.getElementById('deathScreenRestartButton');
            
            if (this.restartButton) {
                this.restartButton.addEventListener('click', () => this.restart());
            }
        });
    }

    drawBackgroundGradient() {
        ctx.save();
        
        // Much stronger gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,          // Center
            this.x, this.y, 200         // Smaller radius
        );
        
        // Much more obvious colors
        gradient.addColorStop(0, 'rgba(255, 220, 200, 1)');      // Solid warm center
        gradient.addColorStop(0.4, 'rgba(255, 235, 225, 0.8)');  // Strong mid fade
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');      // Fade to white

        ctx.globalCompositeOperation = 'destination-over';  // Draw behind everything
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.restore();
    }

    draw() {
        if (this.isExploded && !this.isAnimatingExplosion) {
            return; // Don't draw character if exploded and animation is done
        }

        // Clear the entire canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and apply shake
        this.updateShakeEffect();
        
        // Save the context state
        ctx.save();
        
        // Apply shake translation to everything
        ctx.translate(this.shakeOffset.x, this.shakeOffset.y);

        // Draw soft radial gradient background
        ctx.save();
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,          // Inner circle center
            this.x, this.y, 400         // Outer circle radius
        );
        
        // Very subtle color stops
        gradient.addColorStop(0, 'rgba(245, 240, 235, 0.6)');    // Warm light gray
        gradient.addColorStop(0.5, 'rgba(250, 245, 240, 0.3)');  // Lighter mid
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');      // Fade to white
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw the rest of the character
        const bodyOffset = this.bellySize * 0.4;

        // Draw hover effect
        if (this.isHovering) {
            ctx.save();
            const gradient = ctx.createRadialGradient(
                this.x, this.y + 50 - bodyOffset,
                this.bellySize,
                this.x, this.y + 50 - bodyOffset,
                this.bellySize + 10
            );
            gradient.addColorStop(0, 'rgba(255, 220, 180, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 220, 180, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 50 - bodyOffset, this.bellySize + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw character body
        ctx.beginPath();
        ctx.fillStyle = '#E3B098';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;

        // Draw torso
        ctx.beginPath();
        ctx.moveTo(this.x - 45, this.y - 60 - bodyOffset);
        ctx.quadraticCurveTo(
            this.x, this.y + 40 - bodyOffset,
            this.x + 45, this.y - 60 - bodyOffset
        );
        ctx.lineTo(this.x + 45, this.y + 90 - bodyOffset);
        ctx.quadraticCurveTo(
            this.x, this.y + 90 + this.bellySize/2 - bodyOffset,
            this.x - 45, this.y + 90 - bodyOffset
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw belly
        ctx.save();
        const bellyGradient = ctx.createRadialGradient(
            this.x - this.bellySize * 0.2, 
            this.y + 50 - bodyOffset, 
            0,
            this.x, 
            this.y + 50 - bodyOffset, 
            this.bellySize
        );
        bellyGradient.addColorStop(0, '#E3B098');
        bellyGradient.addColorStop(1, '#D4A088');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y + 50 - bodyOffset, this.bellySize, 0, Math.PI * 2);
        ctx.fillStyle = bellyGradient;
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw limbs
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y + 100 - bodyOffset);
        ctx.lineTo(this.x - 30, this.y + 170 - bodyOffset);
        ctx.moveTo(this.x + 20, this.y + 100 - bodyOffset);
        ctx.lineTo(this.x + 30, this.y + 170 - bodyOffset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x - 40, this.y - 30 - bodyOffset);
        ctx.quadraticCurveTo(
            this.x - 60, this.y - bodyOffset,
            this.x - 70, this.y + 30 - bodyOffset
        );
        ctx.moveTo(this.x + 40, this.y - 30 - bodyOffset);
        ctx.quadraticCurveTo(
            this.x + 60, this.y - bodyOffset,
            this.x + 70, this.y + 30 - bodyOffset
        );
        ctx.stroke();

        // Draw face
        ctx.drawImage(
            faceImage, 
            this.x - 200,
            this.y - 250 - bodyOffset,
            400,
            400
        );

        // Draw chat if not at max size
        if (!this.isExploded && !this.isMaxSize) {
            this.drawChat();
        }

        // Draw guide text if not at max size
        if (!this.isExploded && !this.isMaxSize) {
            this.drawGuideText();
        }

        // Draw click effects
        this.clickEffects = this.clickEffects.filter(effect => {
            if ('radius' in effect) {
                // Single circle ripple
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(34, 197, 94, ${effect.opacity})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                effect.radius += effect.growthSpeed;
                effect.opacity -= 0.03;

                return effect.opacity > 0;
            } else {
                // Floating text effect
                ctx.save();
                ctx.font = '20px "Segoe UI"';
                ctx.textAlign = 'center';
                ctx.fillStyle = `rgba(0, 0, 0, ${effect.opacity})`;
                ctx.fillText(effect.text, effect.x, effect.y - effect.offsetY);
                ctx.restore();

                effect.offsetY += 1;
                effect.opacity -= 0.02;

                return effect.opacity > 0;
            }
        });

        // Restore the context
        ctx.restore();

        // Draw progress bar if not exploded
        if (!this.isExploded) {
            this.updateProgress();
        }
    }

    inflate() {
        if (!this.isExploded) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = lastClickX - rect.left;
            const mouseY = lastClickY - rect.top;

            this.addClickEffect(mouseX, mouseY);
            this.addInflationText(mouseX, mouseY - 20);

            this.bellySize += this.inflationRate;
            
            // Add extra shake on each click when near max size
            const progress = (this.bellySize - this.initialBellySize) / 
                           (this.maxBellySize - this.initialBellySize);
            if (progress > 0.8) {
                this.shakeIntensity = 8; // Temporary intense shake on click
                setTimeout(() => {
                    this.shakeIntensity = 5; // Return to normal shake
                }, 100);
            }

            // Update progress bar
            this.updateProgress();

            if (this.bellySize >= this.maxBellySize) {
                this.isExploded = true;
                this.shakeIntensity = 10; // Max shake before explosion
                this.explode();
            }
        }
    }

    drawChat() {
        ctx.save();
        
        const bodyOffset = this.bellySize * 0.4;
        this.chatOpacity = 0.92 + Math.sin(Date.now() / 1000) * 0.08;

        const chatX = this.x - 2;
        const chatY = this.y - 290 - bodyOffset;
        
        const padding = 12;
        const message = this.getChatMessage();
        
        ctx.font = '500 16px "Segoe UI", system-ui, -apple-system, sans-serif';
        const textWidth = ctx.measureText(message).width;
        const bubbleWidth = textWidth + (padding * 2);
        const bubbleHeight = 34;
        
        // Apply animations
        ctx.translate(chatX, chatY);
        ctx.rotate(this.bubbleRotation * Math.PI / 180);
        ctx.scale(this.bubbleScale, this.bubbleScale);
        ctx.translate(-chatX, -chatY);

        // Enhanced shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = 8;  // Reduced blur
        ctx.shadowOffsetY = 3;  // Reduced offset

        // Main bubble
        ctx.beginPath();
        ctx.roundRect(
            chatX - bubbleWidth/2,
            chatY - bubbleHeight/2,
            bubbleWidth,
            bubbleHeight,
            bubbleHeight/2
        );
        ctx.fillStyle = 'white';
        ctx.fill();

        // Smaller tail
        ctx.beginPath();
        ctx.moveTo(chatX - 8, chatY + bubbleHeight/2);  // Reduced from 10
        ctx.lineTo(chatX, chatY + bubbleHeight/2 + 12); // Reduced from 15
        ctx.lineTo(chatX + 8, chatY + bubbleHeight/2);  // Reduced from 10
        ctx.fillStyle = 'white';
        ctx.fill();

        // Text
        ctx.shadowColor = 'transparent';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(60, 60, 60, ${this.chatOpacity})`;
        ctx.fillText(message, chatX, chatY);

        ctx.restore();
    }

    getChatMessage() {
        const progress = (this.bellySize - this.initialBellySize) / 
                        (this.maxBellySize - this.initialBellySize);
        
        // Update bubble animation based on progress
        if (progress < 0.2) {
            this.bubbleScale = 1 + Math.sin(Date.now() / 500) * 0.02; // Subtle bounce
            return "Ayo chill… I just ate bro 😭";
        } 
        else if (progress < 0.4) {
            this.bubbleRotation = Math.sin(Date.now() / 300) * 2; // Gentle shake
            return "Nahhh, why am I lowkey feelin' full? 💀";
        }
        else if (progress < 0.6) {
            this.bubbleScale = 1 + Math.sin(Date.now() / 400) * 0.04; // Pulse effect
            return "Bro I'm startin' to look like a Fortnite emote 💢";
        }
        else if (progress < 0.8) {
            this.bubbleRotation = Math.sin(Date.now() / 200) * 3; // Faster shake
            return "I CAN'T SEE MY TOES ANYMORE 😳";
        }
        else {
            // Aggressive pulse + shake
            this.bubbleScale = 1 + Math.sin(Date.now() / 300) * 0.06;
            this.bubbleRotation = Math.sin(Date.now() / 150) * 4;
            return "Yo... YO... THIS IS NOT A DRILL 🚨😭";
        }
    }

    drawGuideText() {
        ctx.save();

        // Fade animation every 4 seconds
        const currentTime = Date.now();
        if (currentTime - this.lastFadeTime > 4000) {
            // Reset fade cycle
            this.lastFadeTime = currentTime;
        }

        // Calculate opacity based on time in cycle
        const fadeTime = currentTime - this.lastFadeTime;
        let opacity = 1;
        
        if (fadeTime < 500) {
            // Fade in
            opacity = fadeTime / 500;
        } else if (fadeTime > 3500) {
            // Fade out
            opacity = 1 - ((fadeTime - 3500) / 500);
        }
        
        const textY = this.y + 190;  // No more bounce offset

        // Draw arrow with fade
        ctx.beginPath();
        ctx.moveTo(this.x, textY - 28);
        ctx.lineTo(this.x - 8, textY - 18);
        ctx.lineTo(this.x + 8, textY - 18);
        ctx.closePath();
        ctx.fillStyle = `rgba(34, 197, 94, ${0.6 * opacity})`;
        ctx.fill();

        // Text with fade
        ctx.font = '500 17px "Segoe UI", system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = `rgba(34, 197, 94, ${0.85 * opacity})`;
        ctx.fillText('Tap the Belly for Chaos! 🔥', this.x, textY);

        ctx.restore();
    }

    explode() {
        this.isAnimatingExplosion = true;
        const explosionX = this.x;
        const explosionY = this.y + 50;
        
        // Re-get the death screen element in case it wasn't ready before
        this.deathScreen = document.getElementById('deathScreen');
        
        if (this.deathScreen) {
            this.deathScreen.classList.add('show');
        }
        
        const particles = [];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 8 + Math.random() * 8;
            
            particles.push({
                x: explosionX,
                y: explosionY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 5,
                rotation: Math.random() * 360,
                opacity: 1,
                scale: 0.5 + Math.random() * 0.5
            });
        }

        const solanaCoin = new Image();
        solanaCoin.src = 'Solana_logo.png';  // Changed to use the Solana logo file
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let stillAnimating = false;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3;
                p.rotation += 5;
                p.opacity -= 0.01;
                
                if (p.opacity > 0) {
                    ctx.save();
                    ctx.globalAlpha = p.opacity;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.drawImage(
                        solanaCoin, 
                        -25 * p.scale,  // Increased from -15 to -25
                        -25 * p.scale,  // Increased from -15 to -25
                        50 * p.scale,   // Increased from 30 to 50
                        50 * p.scale    // Increased from 30 to 50
                    );
                    ctx.restore();
                    stillAnimating = true;
                }
            });

            if (stillAnimating) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimatingExplosion = false;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.showDeathScreen();
            }
        };

        animate();

        // After explosion animation ends, reset shake
        this.shakeIntensity = 0;
    }

    addClickEffect(x, y) {
        // Simpler ripple effect
        const effect = {
            x: x,
            y: y,
            radius: 15,
            opacity: 0.4,
            maxRadius: 30,
            growthSpeed: 1.5
        };
        this.clickEffects.push(effect);
    }

    addInflationText(x, y) {
        const randomEmoji = this.inflationTexts[Math.floor(Math.random() * this.inflationTexts.length)];
        const text = {
            x: x,
            y: y,
            text: randomEmoji,
            opacity: 1,
            offsetY: 0
        };
        this.clickEffects.push(text);
    }

    updateShakeEffect() {
        const progress = (this.bellySize - this.initialBellySize) / 
                        (this.maxBellySize - this.initialBellySize);
        
        // Calculate shake intensity based on progress
        if (progress > 0.8) {
            this.shakeIntensity = 5;  // Strong shake
        } else if (progress > 0.6) {
            this.shakeIntensity = 3;  // Medium shake
        } else if (progress > 0.4) {
            this.shakeIntensity = 2;  // Light shake
        } else {
            this.shakeIntensity = progress * 1.5;  // Subtle shake
        }

        // Update shake more frequently for smoother animation
        const currentTime = Date.now();
        if (currentTime - this.lastShakeTime > 50) {  // Update every 50ms
            this.shakeOffset = {
                x: (Math.random() - 0.5) * this.shakeIntensity * 2,
                y: (Math.random() - 0.5) * this.shakeIntensity * 2
            };
            this.lastShakeTime = currentTime;
        }
    }

    drawProgressBar() {
        const progress = (this.bellySize - this.initialBellySize) / 
                        (this.maxBellySize - this.initialBellySize);
        
        // Bar container
        const barWidth = canvas.width - (this.progressBarPadding * 2);
        const barX = this.progressBarPadding;
        
        // Background bar
        ctx.beginPath();
        ctx.roundRect(
            barX,
            this.progressBarY,
            barWidth,
            this.progressBarHeight,
            this.progressBarHeight / 2
        );
        ctx.fillStyle = '#E5E7EB';
        ctx.fill();

        // Progress fill
        const fillWidth = barWidth * progress;
        ctx.beginPath();
        ctx.roundRect(
            barX,
            this.progressBarY,
            fillWidth,
            this.progressBarHeight,
            this.progressBarHeight / 2
        );

        // Gradient fill
        const gradient = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
        gradient.addColorStop(0, '#22C55E');  // Green
        gradient.addColorStop(1, '#15803D');  // Darker green
        ctx.fillStyle = gradient;
        ctx.fill();

        // Shine effect
        ctx.beginPath();
        ctx.roundRect(
            barX,
            this.progressBarY,
            fillWidth,
            this.progressBarHeight / 2,
            this.progressBarHeight / 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();

        // Pulsing glow on near completion
        if (progress > 0.8) {
            ctx.save();
            ctx.globalAlpha = 0.15 + Math.sin(Date.now() / 200) * 0.1;
            ctx.shadowColor = '#22C55E';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(
                barX,
                this.progressBarY,
                fillWidth,
                this.progressBarHeight,
                this.progressBarHeight / 2
            );
            ctx.fill();
            ctx.restore();
        }
    }

    updateProgress() {
        const progress = (this.bellySize - this.initialBellySize) / 
                        (this.maxBellySize - this.initialBellySize);
        const percentage = Math.min(Math.round(progress * 100), 100);
        
        if (this.progressBar) {
            this.progressBar.style.height = `${percentage}%`;
        }
        if (this.progressPercentage) {
            this.progressPercentage.textContent = `${percentage}%`;
        }
    }

    restart() {
        // Reset character properties
        this.bellySize = this.initialBellySize;
        this.isExploded = false;
        this.isAnimatingExplosion = false;
        this.shakeIntensity = 0;
        
        // Hide death screen
        if (this.deathScreen) {
            this.deathScreen.classList.remove('show');
        }
        
        // Reset progress
        if (this.progressBar) {
            this.progressBar.style.height = '0%';
        }
        if (this.progressPercentage) {
            this.progressPercentage.textContent = '0%';
        }

        // Clear canvas and redraw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.draw();
    }

    showDeathScreen() {
        if (this.deathScreen) {
            this.deathScreen.classList.add('show');
        }
    }
}

const character = new Character();

function drawAbstractBackground() {
    ctx.save();
    ctx.globalAlpha = 0.05; // Very faint - 5% opacity

    // Diagonal lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = -100; i < canvas.width + 100; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 100, canvas.height);
        ctx.stroke();
    }

    // Floating circles
    const time = Date.now() / 5000; // Slow movement
    for (let i = 0; i < 5; i++) {
        const x = canvas.width * (0.2 + 0.6 * Math.sin(time + i));
        const y = canvas.height * (0.2 + 0.6 * Math.cos(time + i * 2));
        const radius = 20 + Math.sin(time + i * 3) * 10;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#F3F4F6';
        ctx.fill();
    }

    // Subtle waves
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 2) {
        const y = Math.sin(x / 50 + time) * 20 + canvas.height / 2;
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = '#E5E7EB';
    ctx.stroke();

    ctx.restore();
}

function gameLoop() {
    if (!character.isExploded || character.isAnimatingExplosion) {
        character.draw();
    } else {
        // Reset shake when game ends
        character.shakeIntensity = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if mouse is over belly
    const bodyOffset = character.bellySize * 0.4;
    const dx = mouseX - character.x;
    const dy = mouseY - (character.y + 50 - bodyOffset);
    character.isHovering = (dx * dx + dy * dy) <= (character.bellySize * character.bellySize);
});

canvas.addEventListener('click', (e) => {
    lastClickX = e.clientX;
    lastClickY = e.clientY;
    character.inflate();
});

// Make sure the canvas is properly sized
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

// Add resize listener
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

gameLoop(); 