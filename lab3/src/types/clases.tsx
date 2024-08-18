export class Node {
    id: string;
    neighbors: string[];
    routingTable: Map<string, string>;

    constructor(id: string, neighbors: string[]) {
        this.id = id;
        this.neighbors = neighbors;
        this.routingTable = new Map();
    }
    
}