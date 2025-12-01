// ========================================
// 3D INTERACTIVE MIND MAP - Tech Glossary Visualization
// ========================================

class TechMindMap3D {
    constructor(containerId, glossaryData, categoryColors) {
        this.container = document.getElementById(containerId);
        this.glossary = glossaryData;
        this.categoryColors = categoryColors;
        this.categoryFilter = 'all';
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Node storage
        this.nodes = [];
        this.nodeMeshes = [];
        this.connections = [];
        this.lineMeshes = [];
        
        // Interaction state
        this.selectedNode = null;
        this.hoveredNode = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Animation
        this.animationId = null;
        this.autoRotate = true;
        this.rotationSpeed = 0.001;
        
        // Physics
        this.physicsEnabled = true;
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.generateNodes();
        this.generateConnections();
        this.createNodeMeshes();
        this.createConnectionMeshes();
        this.setupEventListeners();
        this.start();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        this.scene.fog = new THREE.Fog(0x0a0a1a, 500, 2000);
        
        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 3000);
        this.camera.position.set(0, 0, 600);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Point lights for neon effect
        const light1 = new THREE.PointLight(0x00ffff, 1, 1000);
        light1.position.set(200, 200, 200);
        this.scene.add(light1);
        
        const light2 = new THREE.PointLight(0xff00ff, 1, 1000);
        light2.position.set(-200, -200, 200);
        this.scene.add(light2);
    }
    
    generateNodes() {
        let words = Object.keys(this.glossary);
        
        if (this.categoryFilter !== 'all') {
            words = words.filter(word => this.glossary[word].category === this.categoryFilter);
        }
        
        // Distribute nodes in 3D sphere
        const radius = 300;
        words.forEach((word, index) => {
            const phi = Math.acos(-1 + (2 * index) / words.length);
            const theta = Math.sqrt(words.length * Math.PI) * phi;
            
            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(phi);
            
            this.nodes.push({
                word: word,
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                z: z + (Math.random() - 0.5) * 50,
                vx: 0,
                vy: 0,
                vz: 0,
                radius: 8,
                data: this.glossary[word]
            });
        });
    }
    
    generateConnections() {
        this.connections = [];
        const maxConnectionsPerNode = 3;
        
        this.nodes.forEach(node => {
            const related = node.data.related || [];
            let connectionsAdded = 0;
            
            for (const relatedWord of related) {
                if (connectionsAdded >= maxConnectionsPerNode) break;
                
                const targetNode = this.nodes.find(n => n.word === relatedWord);
                if (targetNode) {
                    const exists = this.connections.some(
                        conn => (conn.from === node && conn.to === targetNode) ||
                                (conn.from === targetNode && conn.to === node)
                    );
                    
                    if (!exists) {
                        this.connections.push({ from: node, to: targetNode });
                        connectionsAdded++;
                    }
                }
            }
        });
    }
    
    createNodeMeshes() {
        this.nodes.forEach(node => {
            const color = new THREE.Color(this.categoryColors[node.data.category] || '#00ffff');
            
            // Sphere geometry
            const geometry = new THREE.SphereGeometry(node.radius, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5,
                shininess: 100
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(node.x, node.y, node.z);
            mesh.userData = { node: node };
            
            this.scene.add(mesh);
            this.nodeMeshes.push(mesh);
            
            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(node.radius * 1.5, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.2
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            mesh.add(glowMesh);
        });
    }
    
    createConnectionMeshes() {
        this.connections.forEach(conn => {
            const points = [
                new THREE.Vector3(conn.from.x, conn.from.y, conn.from.z),
                new THREE.Vector3(conn.to.x, conn.to.y, conn.to.z)
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.15
            });
            
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.lineMeshes.push(line);
        });
    }
    
    setupEventListeners() {
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
        
        // Mouse controls
        let isMouseDown = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            this.autoRotate = false;
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                
                this.rotateScene(deltaX * 0.005, deltaY * 0.005);
            }
            
            previousMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
        });
        
        // Zoom with mouse wheel
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * 0.5;
            this.camera.position.z = Math.max(200, Math.min(1500, this.camera.position.z + delta));
        });
    }
    
    rotateScene(deltaX, deltaY) {
        // Rotate all nodes around origin
        this.nodes.forEach((node, index) => {
            const mesh = this.nodeMeshes[index];
            const pos = mesh.position;
            
            // Rotate around Y axis
            const cosY = Math.cos(deltaX);
            const sinY = Math.sin(deltaX);
            const newX = pos.x * cosY - pos.z * sinY;
            const newZ = pos.x * sinY + pos.z * cosY;
            
            pos.x = newX;
            pos.z = newZ;
            
            // Rotate around X axis
            const cosX = Math.cos(deltaY);
            const sinX = Math.sin(deltaY);
            const newY = pos.y * cosX - pos.z * sinX;
            const newZ2 = pos.y * sinX + pos.z * cosX;
            
            pos.y = newY;
            pos.z = newZ2;
            
            // Update node data
            node.x = pos.x;
            node.y = pos.y;
            node.z = pos.z;
        });
        
        // Update connections
        this.updateConnections();
    }
    
    updateConnections() {
        this.connections.forEach((conn, index) => {
            const line = this.lineMeshes[index];
            const positions = line.geometry.attributes.position.array;
            
            positions[0] = conn.from.x;
            positions[1] = conn.from.y;
            positions[2] = conn.from.z;
            positions[3] = conn.to.x;
            positions[4] = conn.to.y;
            positions[5] = conn.to.z;
            
            line.geometry.attributes.position.needsUpdate = true;
        });
    }
    
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycast to find hovered node
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodeMeshes);
        
        // Reset previous hover
        if (this.hoveredNode && this.hoveredNode !== this.selectedNode) {
            this.hoveredNode.material.emissiveIntensity = 0.5;
            this.hoveredNode.scale.set(1, 1, 1);
        }
        
        if (intersects.length > 0) {
            this.hoveredNode = intersects[0].object;
            this.hoveredNode.material.emissiveIntensity = 1.0;
            this.hoveredNode.scale.set(1.3, 1.3, 1.3);
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.hoveredNode = null;
            this.renderer.domElement.style.cursor = 'grab';
        }
    }
    
    onClick(event) {
        if (this.hoveredNode) {
            const node = this.hoveredNode.userData.node;
            this.showDefinition(node);
            this.focusNode(node);
        }
    }
    
    showDefinition(node) {
        const panel = document.getElementById('word-definition-panel');
        const title = document.getElementById('definition-word');
        const category = document.getElementById('definition-category');
        const text = document.getElementById('definition-text');
        const relatedList = document.getElementById('definition-related');
        
        const color = this.categoryColors[node.data.category] || '#00ffff';
        
        title.textContent = node.word.toUpperCase();
        title.style.color = color;
        
        category.textContent = `Category: ${node.data.category}`;
        category.style.color = color;
        
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
        this.selectedNode = this.nodeMeshes.find(m => m.userData.node === node);
    }
    
    focusNode(node) {
        // Smoothly move camera to focus on node
        const targetX = node.x;
        const targetY = node.y;
        const targetZ = node.z + 300;
        
        const animate = () => {
            this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
            this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
            this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
            
            this.camera.lookAt(targetX, targetY, node.z);
            
            const distance = Math.sqrt(
                Math.pow(this.camera.position.x - targetX, 2) +
                Math.pow(this.camera.position.y - targetY, 2) +
                Math.pow(this.camera.position.z - targetZ, 2)
            );
            
            if (distance > 1) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    applyPhysics() {
        if (!this.physicsEnabled) return;
        
        const repulsionStrength = 5000;
        const attractionStrength = 0.01;
        const damping = 0.85;
        
        this.nodes.forEach((nodeA, i) => {
            // Repulsion between all nodes
            this.nodes.forEach((nodeB, j) => {
                if (i >= j) return;
                
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const dz = nodeB.z - nodeA.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                
                const repulsion = repulsionStrength / (distance * distance);
                const fx = (dx / distance) * repulsion;
                const fy = (dy / distance) * repulsion;
                const fz = (dz / distance) * repulsion;
                
                nodeA.vx -= fx;
                nodeA.vy -= fy;
                nodeA.vz -= fz;
                nodeB.vx += fx;
                nodeB.vy += fy;
                nodeB.vz += fz;
            });
            
            // Attraction along connections
            this.connections.forEach(conn => {
                if (conn.from === nodeA || conn.to === nodeA) {
                    const other = conn.from === nodeA ? conn.to : conn.from;
                    const dx = other.x - nodeA.x;
                    const dy = other.y - nodeA.y;
                    const dz = other.z - nodeA.z;
                    
                    nodeA.vx += dx * attractionStrength;
                    nodeA.vy += dy * attractionStrength;
                    nodeA.vz += dz * attractionStrength;
                }
            });
            
            // Apply velocity and damping
            nodeA.x += nodeA.vx;
            nodeA.y += nodeA.vy;
            nodeA.z += nodeA.vz;
            nodeA.vx *= damping;
            nodeA.vy *= damping;
            nodeA.vz *= damping;
            
            // Update mesh position
            const mesh = this.nodeMeshes[i];
            mesh.position.set(nodeA.x, nodeA.y, nodeA.z);
        });
        
        this.updateConnections();
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    start() {
        const animate = () => {
            this.applyPhysics();
            
            // Auto-rotate if enabled
            if (this.autoRotate) {
                this.rotateScene(this.rotationSpeed, 0);
            }
            
            this.renderer.render(this.scene, this.camera);
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }
    
    reset() {
        this.camera.position.set(0, 0, 600);
        this.camera.lookAt(0, 0, 0);
        this.autoRotate = true;
        this.selectedNode = null;
        this.hoveredNode = null;
    }
    
    togglePhysics() {
        this.physicsEnabled = !this.physicsEnabled;
        return this.physicsEnabled;
    }
    
    focusWord(word) {
        const node = this.nodes.find(n => n.word.toLowerCase() === word.toLowerCase());
        if (node) {
            this.showDefinition(node);
            this.focusNode(node);
        }
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
    
    searchWord(query) {
        const lowerQuery = query.toLowerCase();
        const matches = this.nodes.filter(n => n.word.toLowerCase().includes(lowerQuery));
        
        if (matches.length > 0) {
            this.focusNode(matches[0]);
            this.showDefinition(matches[0]);
            return matches;
        }
        return [];
    }
    
    setCategory(category) {
        this.categoryFilter = category;
        
        // Clear existing scene
        this.nodeMeshes.forEach(mesh => this.scene.remove(mesh));
        this.lineMeshes.forEach(line => this.scene.remove(line));
        this.nodeMeshes = [];
        this.lineMeshes = [];
        this.nodes = [];
        this.connections = [];
        
        // Regenerate with new filter
        this.generateNodes();
        this.generateConnections();
        this.createNodeMeshes();
        this.createConnectionMeshes();
    }
}
