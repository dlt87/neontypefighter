// ========================================
// INTERACTIVE MIND MAP - Tech Glossary Visualization
// ========================================

class TechMindMap {
    constructor(canvasId, glossaryData, categoryColors) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.glossary = glossaryData;
        this.categoryColors = categoryColors;
        
        // Node storage
        this.nodes = [];
        this.connections = [];
        
        // Interaction state
        this.selectedNode = null;
        this.hoveredNode = null;
        this.isDraggingNode = false;
        this.isPanning = false;
        this.dragOffset = { x: 0, y: 0 };
        this.panStart = { x: 0, y: 0 };
        
        // View state
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.targetZoom = 1;
        
        // Animation
        this.animationId = null;
        
        // Physics
        this.physicsEnabled = true;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.generateNodes();
        this.generateConnections();
        this.setupEventListeners();
        this.start();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    generateNodes() {
        const words = Object.keys(this.glossary);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.35;
        
        words.forEach((word, index) => {
            const angle = (index / words.length) * Math.PI * 2;
            const distance = radius + Math.random() * 100 - 50;
            
            this.nodes.push({
                word: word,
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                vx: 0,
                vy: 0,
                radius: 12,
                data: this.glossary[word]
            });
        });
    }
    
    generateConnections() {
        this.connections = [];
        const maxConnectionsPerNode = 3; // Limit connections to reduce tangles
        
        // Create connections based on related words
        this.nodes.forEach(node => {
            const related = node.data.related || [];
            let connectionsAdded = 0;
            
            for (const relatedWord of related) {
                if (connectionsAdded >= maxConnectionsPerNode) break;
                
                const targetNode = this.nodes.find(n => n.word === relatedWord);
                if (targetNode) {
                    // Check if connection already exists
                    const exists = this.connections.some(
                        conn => (conn.from === node && conn.to === targetNode) ||
                                (conn.from === targetNode && conn.to === node)
                    );
                    
                    // Check if target node has room for more connections
                    const targetConnections = this.connections.filter(
                        conn => conn.from === targetNode || conn.to === targetNode
                    ).length;
                    
                    if (!exists && targetConnections < maxConnectionsPerNode) {
                        this.connections.push({
                            from: node,
                            to: targetNode
                        });
                        connectionsAdded++;
                    }
                }
            }
        });
        
        // Ensure all nodes have at least 2 connections to prevent isolation
        this.nodes.forEach(node => {
            const nodeConnections = this.connections.filter(
                conn => conn.from === node || conn.to === node
            );
            
            // If node has fewer than 2 connections, connect to nearest nodes
            if (nodeConnections.length < 2) {
                const needed = 2 - nodeConnections.length;
                const sortedByDistance = this.nodes
                    .filter(other => other !== node)
                    .map(other => ({
                        node: other,
                        distance: Math.hypot(other.x - node.x, other.y - node.y)
                    }))
                    .sort((a, b) => a.distance - b.distance);
                
                for (let i = 0; i < needed && i < sortedByDistance.length; i++) {
                    const nearest = sortedByDistance[i].node;
                    const exists = this.connections.some(
                        conn => (conn.from === node && conn.to === nearest) ||
                                (conn.from === nearest && conn.to === node)
                    );
                    if (!exists) {
                        this.connections.push({
                            from: node,
                            to: nearest
                        });
                    }
                }
            }
        });
        
        console.log(`Generated ${this.connections.length} connections`);
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - this.camera.x) / this.camera.zoom;
        const mouseY = (e.clientY - rect.top - this.camera.y) / this.camera.zoom;
        
        const clickedNode = this.getNodeAt(mouseX, mouseY);
        if (clickedNode) {
            this.isDraggingNode = true;
            this.selectedNode = clickedNode;
            this.dragOffset = {
                x: mouseX - clickedNode.x,
                y: mouseY - clickedNode.y
            };
        } else {
            // Start panning if not clicking on a node
            this.isPanning = true;
            this.panStart = {
                x: e.clientX - this.camera.x,
                y: e.clientY - this.camera.y
            };
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        if (this.isPanning) {
            // Pan the canvas
            this.camera.x = e.clientX - this.panStart.x;
            this.camera.y = e.clientY - this.panStart.y;
        } else if (this.isDraggingNode && this.selectedNode) {
            // Drag node
            const mouseX = (e.clientX - rect.left - this.camera.x) / this.camera.zoom;
            const mouseY = (e.clientY - rect.top - this.camera.y) / this.camera.zoom;
            this.selectedNode.x = mouseX - this.dragOffset.x;
            this.selectedNode.y = mouseY - this.dragOffset.y;
            this.selectedNode.vx = 0;
            this.selectedNode.vy = 0;
        } else {
            // Check for hover
            const mouseX = (e.clientX - rect.left - this.camera.x) / this.camera.zoom;
            const mouseY = (e.clientY - rect.top - this.camera.y) / this.camera.zoom;
            this.hoveredNode = this.getNodeAt(mouseX, mouseY);
            this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
        }
    }
    
    handleMouseUp(e) {
        this.isDraggingNode = false;
        this.isPanning = false;
        this.canvas.style.cursor = 'grab';
    }
    
    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Get world position before zoom
        const worldXBefore = (mouseX - this.camera.x) / this.camera.zoom;
        const worldYBefore = (mouseY - this.camera.y) / this.camera.zoom;
        
        // Apply zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.3, Math.min(3, this.camera.zoom * zoomFactor));
        
        // Get world position after zoom
        const worldXAfter = (mouseX - this.camera.x) / newZoom;
        const worldYAfter = (mouseY - this.camera.y) / newZoom;
        
        // Adjust camera to keep cursor position fixed
        this.camera.x += (worldXAfter - worldXBefore) * newZoom;
        this.camera.y += (worldYAfter - worldYBefore) * newZoom;
        
        this.targetZoom = newZoom;
        this.camera.zoom = newZoom;
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - this.camera.x) / this.camera.zoom;
        const mouseY = (e.clientY - rect.top - this.camera.y) / this.camera.zoom;
        
        const clickedNode = this.getNodeAt(mouseX, mouseY);
        if (clickedNode) {
            this.showDefinition(clickedNode);
        }
    }
    
    getNodeAt(x, y) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            const dx = x - node.x;
            const dy = y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < node.radius + 20) {
                return node;
            }
        }
        return null;
    }
    
    showDefinition(node) {
        const panel = document.getElementById('word-definition-panel');
        const title = document.getElementById('definition-word');
        const category = document.getElementById('definition-category');
        const text = document.getElementById('definition-text');
        const relatedList = document.getElementById('definition-related');
        
        title.textContent = node.word.toUpperCase();
        title.style.color = this.categoryColors[node.data.category] || '#00ffff';
        
        category.textContent = `Category: ${node.data.category}`;
        category.style.color = this.categoryColors[node.data.category] || '#00ffff';
        
        text.textContent = node.data.definition;
        
        relatedList.innerHTML = '';
        (node.data.related || []).forEach(relatedWord => {
            const li = document.createElement('li');
            li.textContent = relatedWord;
            li.style.cursor = 'pointer';
            li.addEventListener('click', () => {
                const relatedNode = this.nodes.find(n => n.word === relatedWord);
                if (relatedNode) {
                    this.showDefinition(relatedNode);
                    this.focusNode(relatedNode);
                }
            });
            relatedList.appendChild(li);
        });
        
        panel.classList.remove('hidden');
        this.selectedNode = node;
    }
    
    focusNode(node) {
        // Smoothly pan to node
        this.camera.x = this.canvas.width / 2 - node.x * this.camera.zoom;
        this.camera.y = this.canvas.height / 2 - node.y * this.camera.zoom;
    }
    
    // Focus on a word by name (called from Learn Mode)
    focusWord(word) {
        const node = this.nodes.find(n => n.word.toLowerCase() === word.toLowerCase());
        if (node) {
            // Pan camera to node
            this.camera.x = this.canvas.width / 2 - node.x * this.camera.zoom;
            this.camera.y = this.canvas.height / 2 - node.y * this.camera.zoom;
            
            // Show definition
            this.showDefinition(node);
            
            // Highlight node temporarily
            node.highlighted = true;
            setTimeout(() => {
                node.highlighted = false;
            }, 3000);
        }
    }
    
    applyPhysics() {
        if (!this.physicsEnabled) return;
        
        const repulsionStrength = 3000;
        const attractionStrength = 0.001;
        const damping = 0.9;
        
        // Apply forces between all nodes
        for (let i = 0; i < this.nodes.length; i++) {
            const nodeA = this.nodes[i];
            
            // Skip dragged node
            if (nodeA === this.selectedNode && this.isDragging) continue;
            
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeB = this.nodes[j];
                if (nodeB === this.selectedNode && this.isDragging) continue;
                
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                
                // Repulsion (all nodes push each other away)
                const repulsion = repulsionStrength / (distance * distance);
                const fx = (dx / distance) * repulsion;
                const fy = (dy / distance) * repulsion;
                
                nodeA.vx -= fx;
                nodeA.vy -= fy;
                nodeB.vx += fx;
                nodeB.vy += fy;
            }
            
            // Attraction along connections
            this.connections.forEach(conn => {
                if (conn.from === nodeA || conn.to === nodeA) {
                    const other = conn.from === nodeA ? conn.to : conn.from;
                    const dx = other.x - nodeA.x;
                    const dy = other.y - nodeA.y;
                    
                    nodeA.vx += dx * attractionStrength;
                    nodeA.vy += dy * attractionStrength;
                }
            });
            
            // Apply velocity and damping
            nodeA.x += nodeA.vx;
            nodeA.y += nodeA.vy;
            nodeA.vx *= damping;
            nodeA.vy *= damping;
        }
    }
    
    draw() {
        // Smooth zoom
        this.camera.zoom += (this.targetZoom - this.camera.zoom) * 0.1;
        
        // Clear canvas
        this.ctx.fillStyle = 'rgba(10, 10, 26, 0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply camera transform
        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        
        // Draw connections first (behind nodes)
        this.drawConnections();
        
        // Draw nodes
        this.drawNodes();
        
        this.ctx.restore();
        
        // Draw UI overlay
        this.drawUI();
    }
    
    drawConnections() {
        this.connections.forEach(conn => {
            const alpha = this.selectedNode === conn.from || this.selectedNode === conn.to ? 0.6 : 0.15;
            
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(conn.from.x, conn.from.y);
            this.ctx.lineTo(conn.to.x, conn.to.y);
            this.ctx.stroke();
        });
    }
    
    drawNodes() {
        this.nodes.forEach(node => {
            const isSelected = node === this.selectedNode;
            const isHovered = node === this.hoveredNode;
            const isHighlighted = node.highlighted || false;
            const color = this.categoryColors[node.data.category] || '#00ffff';
            
            // Node glow (extra strong for highlighted nodes)
            if (isSelected || isHovered || isHighlighted) {
                const glowSize = isHighlighted ? 40 : 30;
                const gradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
                gradient.addColorStop(0, color + (isHighlighted ? '80' : '40'));
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(node.x - glowSize, node.y - glowSize, glowSize * 2, glowSize * 2);
            }
            
            // Pulsing effect for highlighted nodes
            const pulseScale = isHighlighted ? 1 + Math.sin(Date.now() / 300) * 0.1 : 1;
            const displayRadius = node.radius * pulseScale;
            
            // Node circle
            this.ctx.fillStyle = isSelected ? color : (isHovered || isHighlighted ? color + 'dd' : color + '99');
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Node border
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = isSelected || isHighlighted ? 3 : (isHovered ? 2 : 1);
            this.ctx.stroke();
            
            // Label (only for selected, hovered, highlighted, or zoomed in)
            if (isSelected || isHovered || isHighlighted || this.camera.zoom > 0.8) {
                this.ctx.fillStyle = color;
                this.ctx.font = `${16 + (isSelected || isHighlighted ? 3 : 0)}px Orbitron, monospace`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                // Text shadow
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = isSelected || isHighlighted ? 15 : 10;
                this.ctx.fillText(node.word, node.x, node.y + displayRadius + 20);
                this.ctx.shadowBlur = 0;
            }
        });
    }
    
    drawUI() {
        // Instructions
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        this.ctx.font = '14px Orbitron, monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Click nodes to learn • Drag to move • Scroll to zoom', 10, 20);
        
        // Node count
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${this.nodes.length} words mapped`, this.canvas.width - 10, 20);
    }
    
    start() {
        const animate = () => {
            this.applyPhysics();
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    reset() {
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.targetZoom = 1;
        this.selectedNode = null;
        this.hoveredNode = null;
        this.nodes.forEach(node => {
            node.vx = 0;
            node.vy = 0;
        });
    }
    
    searchWord(query) {
        const lowerQuery = query.toLowerCase();
        const matches = this.nodes.filter(n => n.word.toLowerCase().includes(lowerQuery));
        
        if (matches.length > 0) {
            // Focus on first match
            this.focusNode(matches[0]);
            this.showDefinition(matches[0]);
            return matches;
        }
        return [];
    }
    
    getSuggestions(query) {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();
        return this.nodes
            .filter(n => n.word.toLowerCase().includes(lowerQuery))
            .map(n => n.word)
            .sort()
            .slice(0, 10);
    }
}
