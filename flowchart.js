const app = {
    nodes: {},
    connections: [],
    
    async init() {
        document.getElementById('load-btn').addEventListener('click', () => this.reset());
        await this.loadNode('sidebar', 50, 50, 0);
    },

    reset() {
        document.getElementById('nodes-container').innerHTML = '';
        document.getElementById('connector-svg').innerHTML = '';
        this.nodes = {};
        this.connections = [];
        this.loadNode('sidebar', 50, 50, 0);
    },

    async loadNode(nodeId, x, y, level) {
        try {
            const response = await fetch(`json/${nodeId}.json`);
            const data = await response.json();
            this.nodes[nodeId] = { ...data, x, y, level };
            this.renderNode(nodeId);
        } catch (error) {
            console.error(`Erro ao carregar ${nodeId}:`, error);
        }
    },

    toggleNode(nodeId) {
        const node = this.nodes[nodeId];
        const nodeElement = document.getElementById(`node-${nodeId}`);
        
        nodeElement.classList.toggle('open');
        
        if (nodeElement.classList.contains('open')) {
            this.openNode(nodeId);
        } else {
            this.closeNode(nodeId);
        }
    },

    async openNode(nodeId) {
        const node = this.nodes[nodeId];
        
        if (!node.childrenLoaded && node.children_id) {
            let yPos = node.y;
            for (const childId of node.children_id) {
                const cleanId = childId.replace('.json', '');
                await this.loadNode(cleanId, node.x + 200, yPos, node.level + 1);
                this.createConnection(nodeId, cleanId);
                yPos += 120;
            }
            node.childrenLoaded = true;
        }
        
        this.showChildren(nodeId);
    },

    showChildren(nodeId) {
        const node = this.nodes[nodeId];
        if (!node.children_id) return;

        node.children_id.forEach(childId => {
            const cleanId = childId.replace('.json', '');
            const childElement = document.getElementById(`node-${cleanId}`);
            if (childElement) {
                childElement.style.display = 'block';
                this.updateConnection(nodeId, cleanId);
            }
        });
    },

    closeNode(nodeId) {
        const node = this.nodes[nodeId];
        if (!node.children_id) return;

        node.children_id.forEach(childId => {
            const cleanId = childId.replace('.json', '');
            const childElement = document.getElementById(`node-${cleanId}`);
            if (childElement) {
                childElement.style.display = 'none';
                this.closeNode(cleanId); // Fecha recursivamente
            }
        });
    },

    renderNode(nodeId) {
        const node = this.nodes[nodeId];
        const container = document.getElementById('nodes-container');
        
        const nodeElement = document.createElement('div');
        nodeElement.className = `node level-${node.level}`;
        nodeElement.id = `node-${nodeId}`;
        nodeElement.innerHTML = `
            <strong>${node.name}</strong>
            <div class="desc">${node.desc}</div>
            <div class="state-indicator"></div>
        `;
        
        nodeElement.style.left = `${node.x}px`;
        nodeElement.style.top = `${node.y}px`;
        nodeElement.style.display = node.level === 0 ? 'block' : 'none';
        
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNode(nodeId);
        });
        
        container.appendChild(nodeElement);
    },

    createConnection(sourceId, targetId) {
        const svg = document.getElementById('connector-svg');
        const lineId = `conn-${sourceId}-${targetId}`;
        
        // Evita duplicação
        if (document.getElementById(lineId)) return;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.id = lineId;
        line.setAttribute('stroke', '#666');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('fill', 'none');
        line.style.display = 'none';
        
        svg.appendChild(line);
        this.connections.push({ source: sourceId, target: targetId });
        this.updateConnection(sourceId, targetId);
    },

    updateConnection(sourceId, targetId) {
        const line = document.getElementById(`conn-${sourceId}-${targetId}`);
        if (!line) return;
        
        const source = document.getElementById(`node-${sourceId}`);
        const target = document.getElementById(`node-${targetId}`);
        if (!source || !target) return;
        
        const startX = source.offsetLeft + source.offsetWidth;
        const startY = source.offsetTop + source.offsetHeight / 2;
        const endX = target.offsetLeft;
        const endY = target.offsetTop + target.offsetHeight / 2;
        const ctrlX = (startX + endX) / 2;
        
        line.setAttribute('d', `M${startX},${startY} C${ctrlX},${startY} ${ctrlX},${endY} ${endX},${endY}`);
        
        // Mostra/esconde conforme necessário
        line.style.display = 
            source.style.display !== 'none' && 
            target.style.display !== 'none' 
                ? 'block' 
                : 'none';
    },

    updateAllConnections() {
        this.connections.forEach(conn => {
            this.updateConnection(conn.source, conn.target);
        });
    }
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => app.init());

// Atualiza conexões ao redimensionar
window.addEventListener('resize', () => {
    app.updateAllConnections();
});