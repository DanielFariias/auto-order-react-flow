"use client"

import { useCallback, useState } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  ReactFlowProvider,
  Position,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, Grid3X3, GitBranch, Layers } from "lucide-react"

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Início" },
    position: { x: 100, y: 50 },
    sourcePosition: Position.Right,
  },
  {
    id: "2",
    data: { label: "Processamento A" },
    position: { x: 300, y: 200 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "3",
    data: { label: "Processamento B" },
    position: { x: 150, y: 300 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "4",
    data: { label: "Validação" },
    position: { x: 500, y: 100 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "5",
    data: { label: "Decisão" },
    position: { x: 400, y: 350 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "6",
    type: "output",
    data: { label: "Resultado Final" },
    position: { x: 700, y: 250 },
    targetPosition: Position.Left,
  },
  {
    id: "7",
    data: { label: "Backup" },
    position: { x: 200, y: 450 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "8",
    data: { label: "Log" },
    position: { x: 600, y: 400 },
    targetPosition: Position.Left,
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
  { id: "e2-4", source: "2", target: "4", animated: true },
  { id: "e3-5", source: "3", target: "5", animated: true },
  { id: "e4-6", source: "4", target: "6", animated: true },
  { id: "e5-6", source: "5", target: "6", animated: true },
  { id: "e3-7", source: "3", target: "7", animated: true },
  { id: "e5-8", source: "5", target: "8", animated: true },
]

type LayoutType =
  | "hierarchical"
  | "grid"
  | "circular"
  | "force"
  | "tree"
  | "radial"
  | "organic"
  | "timeline"
  | "cluster"
  | "spiral"
  | "matrix"

export default function Component() {
  return (
    <div className="w-full h-screen bg-gray-50">
      <ReactFlowProvider>
        <AutoOrderFlow />
      </ReactFlowProvider>
    </div>
  )
}

function AutoOrderFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [layoutType, setLayoutType] = useState<LayoutType>("hierarchical")
  const [isAnimating, setIsAnimating] = useState(false)

  // Algoritmo de layout hierárquico
  const getHierarchicalLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]))
    const inDegree = new Map<string, number>()
    const outEdges = new Map<string, string[]>()

    // Inicializar graus
    nodes.forEach((node) => {
      inDegree.set(node.id, 0)
      outEdges.set(node.id, [])
    })

    // Calcular graus de entrada e saída
    edges.forEach((edge) => {
      const currentIn = inDegree.get(edge.target) || 0
      inDegree.set(edge.target, currentIn + 1)

      const currentOut = outEdges.get(edge.source) || []
      outEdges.set(edge.source, [...currentOut, edge.target])
    })

    // Ordenação topológica para determinar níveis
    const levels: string[][] = []
    const queue = nodes.filter((node) => (inDegree.get(node.id) || 0) === 0).map((node) => node.id)
    const tempInDegree = new Map(inDegree)

    while (queue.length > 0) {
      const currentLevel = [...queue]
      levels.push(currentLevel)
      queue.length = 0

      currentLevel.forEach((nodeId) => {
        const neighbors = outEdges.get(nodeId) || []
        neighbors.forEach((neighbor) => {
          const newDegree = (tempInDegree.get(neighbor) || 0) - 1
          tempInDegree.set(neighbor, newDegree)
          if (newDegree === 0) {
            queue.push(neighbor)
          }
        })
      })
    }

    // Posicionar nós
    const levelHeight = 150
    const nodeSpacing = 200

    return nodes.map((node) => {
      const levelIndex = levels.findIndex((level) => level.includes(node.id))
      const positionInLevel = levels[levelIndex].indexOf(node.id)
      const levelWidth = levels[levelIndex].length * nodeSpacing
      const startX = -levelWidth / 2 + (positionInLevel + 0.5) * nodeSpacing + 400

      return {
        ...node,
        position: {
          x: startX,
          y: levelIndex * levelHeight + 50,
        },
      }
    })
  }, [])

  // Algoritmo de layout em grid
  const getGridLayout = useCallback((nodes: Node[]) => {
    const cols = Math.ceil(Math.sqrt(nodes.length))
    const spacing = 200

    return nodes.map((node, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols

      return {
        ...node,
        position: {
          x: col * spacing + 100,
          y: row * spacing + 100,
        },
      }
    })
  }, [])

  // Algoritmo de layout circular
  const getCircularLayout = useCallback((nodes: Node[]) => {
    const centerX = 400
    const centerY = 300
    const radius = 200

    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length

      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      }
    })
  }, [])

  // Algoritmo de layout por força (simplificado)
  const getForceLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]))
    const positions = new Map(nodes.map((node) => [node.id, { ...node.position }]))

    // Simulação simples de força
    for (let i = 0; i < 50; i++) {
      const forces = new Map<string, { x: number; y: number }>()

      // Inicializar forças
      nodes.forEach((node) => {
        forces.set(node.id, { x: 0, y: 0 })
      })

      // Força de repulsão entre todos os nós
      nodes.forEach((nodeA) => {
        nodes.forEach((nodeB) => {
          if (nodeA.id !== nodeB.id) {
            const posA = positions.get(nodeA.id)!
            const posB = positions.get(nodeB.id)!
            const dx = posA.x - posB.x
            const dy = posA.y - posB.y
            const distance = Math.sqrt(dx * dx + dy * dy) || 1
            const force = 1000 / (distance * distance)

            const forceA = forces.get(nodeA.id)!
            forceA.x += (dx / distance) * force
            forceA.y += (dy / distance) * force
          }
        })
      })

      // Força de atração para nós conectados
      edges.forEach((edge) => {
        const posSource = positions.get(edge.source)!
        const posTarget = positions.get(edge.target)!
        const dx = posTarget.x - posSource.x
        const dy = posTarget.y - posSource.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const force = distance * 0.01

        const forceSource = forces.get(edge.source)!
        const forceTarget = forces.get(edge.target)!

        forceSource.x += (dx / distance) * force
        forceSource.y += (dy / distance) * force
        forceTarget.x -= (dx / distance) * force
        forceTarget.y -= (dy / distance) * force
      })

      // Aplicar forças
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!
        const force = forces.get(node.id)!
        pos.x += force.x * 0.1
        pos.y += force.y * 0.1

        // Manter dentro dos limites
        pos.x = Math.max(50, Math.min(750, pos.x))
        pos.y = Math.max(50, Math.min(550, pos.y))
      })
    }

    return nodes.map((node) => ({
      ...node,
      position: positions.get(node.id)!,
    }))
  }, [])

  // Algoritmo de layout em árvore
  const getTreeLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]))
    const children = new Map<string, string[]>()
    const parents = new Map<string, string>()

    // Encontrar raiz (nó sem pais)
    nodes.forEach((node) => {
      children.set(node.id, [])
    })

    edges.forEach((edge) => {
      const childrenList = children.get(edge.source) || []
      children.set(edge.source, [...childrenList, edge.target])
      parents.set(edge.target, edge.source)
    })

    const roots = nodes.filter((node) => !parents.has(node.id))
    const root = roots[0] || nodes[0]

    const positionTree = (
      nodeId: string,
      level: number,
      index: number,
      levelWidth: number,
    ): { x: number; y: number } => {
      const x = (index + 0.5) * (800 / levelWidth) + 50
      const y = level * 120 + 50
      return { x, y }
    }

    const levels: string[][] = []
    const queue: Array<{ id: string; level: number }> = [{ id: root.id, level: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)

      if (!levels[level]) levels[level] = []
      levels[level].push(id)

      const nodeChildren = children.get(id) || []
      nodeChildren.forEach((childId) => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 })
        }
      })
    }

    return nodes.map((node) => {
      const level = levels.findIndex((levelNodes) => levelNodes.includes(node.id))
      const index = levels[level]?.indexOf(node.id) || 0
      const levelWidth = levels[level]?.length || 1

      return {
        ...node,
        position: positionTree(node.id, level, index, levelWidth),
      }
    })
  }, [])

  // Algoritmo de layout radial
  const getRadialLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    const centerNode = nodes.find((n) => n.type === "input") || nodes[0]
    const centerX = 400
    const centerY = 300

    const distances = new Map<string, number>()
    const queue = [{ id: centerNode.id, distance: 0 }]
    const visited = new Set<string>()

    // BFS para calcular distâncias
    while (queue.length > 0) {
      const { id, distance } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      distances.set(id, distance)

      edges.forEach((edge) => {
        if (edge.source === id && !visited.has(edge.target)) {
          queue.push({ id: edge.target, distance: distance + 1 })
        }
        if (edge.target === id && !visited.has(edge.source)) {
          queue.push({ id: edge.source, distance: distance + 1 })
        }
      })
    }

    const levelNodes = new Map<number, string[]>()
    distances.forEach((distance, nodeId) => {
      if (!levelNodes.has(distance)) levelNodes.set(distance, [])
      levelNodes.get(distance)!.push(nodeId)
    })

    return nodes.map((node) => {
      const distance = distances.get(node.id) || 0
      const level = levelNodes.get(distance) || []
      const index = level.indexOf(node.id)
      const angleStep = (2 * Math.PI) / level.length
      const radius = distance * 80 + (distance === 0 ? 0 : 60)

      if (distance === 0) {
        return { ...node, position: { x: centerX, y: centerY } }
      }

      const angle = index * angleStep
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      }
    })
  }, [])

  // Algoritmo de layout orgânico
  const getOrganicLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    const positions = new Map(
      nodes.map((node) => [
        node.id,
        {
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 100,
        },
      ]),
    )

    // Simulação mais natural com múltiplas forças
    for (let iteration = 0; iteration < 100; iteration++) {
      const forces = new Map<string, { x: number; y: number }>()

      nodes.forEach((node) => {
        forces.set(node.id, { x: 0, y: 0 })
      })

      // Força de repulsão (mais suave)
      nodes.forEach((nodeA) => {
        nodes.forEach((nodeB) => {
          if (nodeA.id !== nodeB.id) {
            const posA = positions.get(nodeA.id)!
            const posB = positions.get(nodeB.id)!
            const dx = posA.x - posB.x
            const dy = posA.y - posB.y
            const distance = Math.sqrt(dx * dx + dy * dy) || 1
            const force = Math.min(500 / (distance * distance), 10)

            const forceA = forces.get(nodeA.id)!
            forceA.x += (dx / distance) * force
            forceA.y += (dy / distance) * force
          }
        })
      })

      // Força de atração para conectados (mais forte)
      edges.forEach((edge) => {
        const posSource = positions.get(edge.source)!
        const posTarget = positions.get(edge.target)!
        const dx = posTarget.x - posSource.x
        const dy = posTarget.y - posSource.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const optimalDistance = 150
        const force = (distance - optimalDistance) * 0.02

        const forceSource = forces.get(edge.source)!
        const forceTarget = forces.get(edge.target)!

        forceSource.x += (dx / distance) * force
        forceSource.y += (dy / distance) * force
        forceTarget.x -= (dx / distance) * force
        forceTarget.y -= (dy / distance) * force
      })

      // Força centrípeta suave
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!
        const centerX = 400
        const centerY = 300
        const dx = centerX - pos.x
        const dy = centerY - pos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const force = distance * 0.001

        const nodeForce = forces.get(node.id)!
        nodeForce.x += (dx / distance) * force
        nodeForce.y += (dy / distance) * force
      })

      // Aplicar forças com damping
      const damping = 0.8
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!
        const force = forces.get(node.id)!
        pos.x += force.x * 0.1 * damping
        pos.y += force.y * 0.1 * damping

        pos.x = Math.max(50, Math.min(750, pos.x))
        pos.y = Math.max(50, Math.min(550, pos.y))
      })
    }

    return nodes.map((node) => ({
      ...node,
      position: positions.get(node.id)!,
    }))
  }, [])

  // Algoritmo de layout timeline
  const getTimelineLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    // Ordenação topológica para sequência temporal
    const inDegree = new Map<string, number>()
    const outEdges = new Map<string, string[]>()

    nodes.forEach((node) => {
      inDegree.set(node.id, 0)
      outEdges.set(node.id, [])
    })

    edges.forEach((edge) => {
      const currentIn = inDegree.get(edge.target) || 0
      inDegree.set(edge.target, currentIn + 1)

      const currentOut = outEdges.get(edge.source) || []
      outEdges.set(edge.source, [...currentOut, edge.target])
    })

    const sequence: string[] = []
    const queue = nodes.filter((node) => (inDegree.get(node.id) || 0) === 0).map((node) => node.id)
    const tempInDegree = new Map(inDegree)

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      sequence.push(nodeId)

      const neighbors = outEdges.get(nodeId) || []
      neighbors.forEach((neighbor) => {
        const newDegree = (tempInDegree.get(neighbor) || 0) - 1
        tempInDegree.set(neighbor, newDegree)
        if (newDegree === 0) {
          queue.push(neighbor)
        }
      })
    }

    // Adicionar nós não conectados
    nodes.forEach((node) => {
      if (!sequence.includes(node.id)) {
        sequence.push(node.id)
      }
    })

    return nodes.map((node) => {
      const index = sequence.indexOf(node.id)
      const totalNodes = sequence.length
      const spacing = 700 / Math.max(totalNodes - 1, 1)

      return {
        ...node,
        position: {
          x: index * spacing + 100,
          y: 300 + Math.sin(index * 0.5) * 50, // Leve ondulação
        },
      }
    })
  }, [])

  // Algoritmo de layout em cluster
  const getClusterLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    // Agrupar nós por tipo ou conectividade
    const clusters = new Map<string, string[]>()

    // Cluster por tipo de nó
    nodes.forEach((node) => {
      const clusterKey = node.type || "default"
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, [])
      }
      clusters.get(clusterKey)!.push(node.id)
    })

    // Se todos são do mesmo tipo, cluster por conectividade
    if (clusters.size === 1) {
      clusters.clear()

      // Encontrar componentes conectados
      const visited = new Set<string>()
      let clusterIndex = 0

      nodes.forEach((node) => {
        if (!visited.has(node.id)) {
          const clusterKey = `cluster-${clusterIndex++}`
          const component: string[] = []
          const stack = [node.id]

          while (stack.length > 0) {
            const currentId = stack.pop()!
            if (visited.has(currentId)) continue

            visited.add(currentId)
            component.push(currentId)

            edges.forEach((edge) => {
              if (edge.source === currentId && !visited.has(edge.target)) {
                stack.push(edge.target)
              }
              if (edge.target === currentId && !visited.has(edge.source)) {
                stack.push(edge.source)
              }
            })
          }

          clusters.set(clusterKey, component)
        }
      })
    }

    const clusterKeys = Array.from(clusters.keys())
    const clusterCenters = clusterKeys.map((_, index) => {
      const angle = (2 * Math.PI * index) / clusterKeys.length
      const radius = 200
      return {
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      }
    })

    return nodes.map((node) => {
      const clusterKey = clusterKeys.find((key) => clusters.get(key)!.includes(node.id))!
      const clusterIndex = clusterKeys.indexOf(clusterKey)
      const clusterNodes = clusters.get(clusterKey)!
      const nodeIndex = clusterNodes.indexOf(node.id)
      const center = clusterCenters[clusterIndex]

      // Posicionar em círculo dentro do cluster
      const angle = (2 * Math.PI * nodeIndex) / clusterNodes.length
      const clusterRadius = Math.min(80, clusterNodes.length * 15)

      return {
        ...node,
        position: {
          x: center.x + clusterRadius * Math.cos(angle),
          y: center.y + clusterRadius * Math.sin(angle),
        },
      }
    })
  }, [])

  // Algoritmo de layout em espiral
  const getSpiralLayout = useCallback((nodes: Node[]) => {
    const centerX = 400
    const centerY = 300
    const spiralSpacing = 30

    return nodes.map((node, index) => {
      const angle = index * 0.5
      const radius = spiralSpacing * Math.sqrt(index)

      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      }
    })
  }, [])

  // Algoritmo de layout matriz
  const getMatrixLayout = useCallback((nodes: Node[], edges: Edge[]) => {
    // Criar matriz de adjacência visual
    const nodeCount = nodes.length
    const cellSize = Math.min(600 / nodeCount, 80)
    const startX = 400 - (nodeCount * cellSize) / 2
    const startY = 300 - (nodeCount * cellSize) / 2

    return nodes.map((node, index) => {
      const row = Math.floor(index / Math.ceil(Math.sqrt(nodeCount)))
      const col = index % Math.ceil(Math.sqrt(nodeCount))

      return {
        ...node,
        position: {
          x: startX + col * cellSize,
          y: startY + row * cellSize,
        },
      }
    })
  }, [])

  const applyAutoLayout = useCallback(() => {
    setIsAnimating(true)

    let newNodes: Node[]

    switch (layoutType) {
      case "hierarchical":
        newNodes = getHierarchicalLayout(nodes, edges)
        break
      case "grid":
        newNodes = getGridLayout(nodes)
        break
      case "circular":
        newNodes = getCircularLayout(nodes)
        break
      case "force":
        newNodes = getForceLayout(nodes, edges)
        break
      case "tree":
        newNodes = getTreeLayout(nodes, edges)
        break
      case "radial":
        newNodes = getRadialLayout(nodes, edges)
        break
      case "organic":
        newNodes = getOrganicLayout(nodes, edges)
        break
      case "timeline":
        newNodes = getTimelineLayout(nodes, edges)
        break
      case "cluster":
        newNodes = getClusterLayout(nodes, edges)
        break
      case "spiral":
        newNodes = getSpiralLayout(nodes)
        break
      case "matrix":
        newNodes = getMatrixLayout(nodes, edges)
        break
      default:
        newNodes = nodes
    }

    setNodes(newNodes)

    setTimeout(() => {
      setIsAnimating(false)
    }, 1000)
  }, [
    nodes,
    edges,
    layoutType,
    setNodes,
    getHierarchicalLayout,
    getGridLayout,
    getCircularLayout,
    getForceLayout,
    getTreeLayout,
    getRadialLayout,
    getOrganicLayout,
    getTimelineLayout,
    getClusterLayout,
    getSpiralLayout,
    getMatrixLayout,
  ])

  const getLayoutIcon = (type: LayoutType) => {
    switch (type) {
      case "hierarchical":
        return <GitBranch className="w-4 h-4" />
      case "grid":
        return <Grid3X3 className="w-4 h-4" />
      case "circular":
        return <ArrowUpDown className="w-4 h-4" />
      case "force":
        return <Layers className="w-4 h-4" />
      case "tree":
        return <GitBranch className="w-4 h-4" />
      case "radial":
        return <ArrowUpDown className="w-4 h-4" />
      case "organic":
        return <Layers className="w-4 h-4" />
      case "timeline":
        return <ArrowUpDown className="w-4 h-4" />
      case "cluster":
        return <Grid3X3 className="w-4 h-4" />
      case "spiral":
        return <ArrowUpDown className="w-4 h-4" />
      case "matrix":
        return <Grid3X3 className="w-4 h-4" />
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Painel de controle */}
      <Card className="absolute top-4 left-4 z-10 w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Auto-Order Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Layout:</label>
            <Select value={layoutType} onValueChange={(value: LayoutType) => setLayoutType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hierarchical">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("hierarchical")}
                    Hierárquico
                  </div>
                </SelectItem>
                <SelectItem value="grid">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("grid")}
                    Grade
                  </div>
                </SelectItem>
                <SelectItem value="circular">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("circular")}
                    Circular
                  </div>
                </SelectItem>
                <SelectItem value="force">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("force")}
                    Força
                  </div>
                </SelectItem>
                <SelectItem value="tree">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("tree")}
                    Árvore
                  </div>
                </SelectItem>
                <SelectItem value="radial">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("radial")}
                    Radial
                  </div>
                </SelectItem>
                <SelectItem value="organic">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("organic")}
                    Orgânico
                  </div>
                </SelectItem>
                <SelectItem value="timeline">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("timeline")}
                    Timeline
                  </div>
                </SelectItem>
                <SelectItem value="cluster">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("cluster")}
                    Cluster
                  </div>
                </SelectItem>
                <SelectItem value="spiral">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("spiral")}
                    Espiral
                  </div>
                </SelectItem>
                <SelectItem value="matrix">
                  <div className="flex items-center gap-2">
                    {getLayoutIcon("matrix")}
                    Matriz
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={applyAutoLayout} disabled={isAnimating} className="w-full">
            {isAnimating ? "Organizando..." : "Aplicar Auto-Layout"}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Hierárquico:</strong> Por dependências
            </p>
            <p>
              <strong>Grade:</strong> Grid uniforme
            </p>
            <p>
              <strong>Circular:</strong> Arranjo circular
            </p>
            <p>
              <strong>Força:</strong> Simulação física
            </p>
            <p>
              <strong>Árvore:</strong> Estrutura hierárquica
            </p>
            <p>
              <strong>Radial:</strong> Camadas concêntricas
            </p>
            <p>
              <strong>Orgânico:</strong> Layout natural
            </p>
            <p>
              <strong>Timeline:</strong> Sequência temporal
            </p>
            <p>
              <strong>Cluster:</strong> Agrupamento
            </p>
            <p>
              <strong>Espiral:</strong> Disposição espiral
            </p>
            <p>
              <strong>Matriz:</strong> Grid baseado em adjacência
            </p>
          </div>
        </CardContent>
      </Card>

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        className={isAnimating ? "transition-all duration-1000 ease-in-out" : ""}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}
