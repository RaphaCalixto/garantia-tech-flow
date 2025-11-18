import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Wrench, Search, Edit, Trash2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Maintenance = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [equipments, setEquipments] = useState<any[]>([]);
  const [editingMaintenance, setEditingMaintenance] = useState<string | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    equipment_id: "",
    data_abertura: "",
    data_termino: "",
    tecnico_responsavel: "",
    problema: "",
    observacoes: "",
    status: "pendente",
  });

  useEffect(() => {
    if (user) {
      loadMaintenances();
      loadEquipments();
    }
  }, [user]);

  const loadEquipments = async () => {
    if (!user) return;

    try {
      const { data: equipmentsData, error } = await supabase
        .from('equipments')
        .select('id, nome, modelo, customer_id, customers(nome_empresa)')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar equipamentos:', error);
        return;
      }

      setEquipments(equipmentsData || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    }
  };

  const loadMaintenances = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenances')
        .select('*, equipments(nome, modelo, customer_id, customers(nome_empresa))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar manutenções:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as manutenções.",
          variant: "destructive",
        });
        return;
      }

      const maintenancesList = (data || []).map((m: any) => ({
        id: m.id,
        numero_os: m.numero_os || m.id,
        equipment: m.equipments?.nome || 'Equipamento',
        equipmentModel: m.equipments?.modelo || '',
        equipment_id: m.equipment_id,
        customer: m.equipments?.customers?.nome_empresa || 'Cliente',
        date: m.data_abertura || m.created_at,
        data_abertura: m.data_abertura || null,
        data_termino: m.data_termino || null,
        tecnico_responsavel: m.tecnico_responsavel || '',
        problema: m.problema || m.problema_relatado || '',
        observacoes: m.observacoes || '',
        status: m.status === 'concluida' ? 'Finalizado' :
                m.status === 'pendente' ? 'Pendente' : 'Pendente',
        statusRaw: m.status,
      }));

      setMaintenances(maintenancesList);
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaintenances = maintenances.filter(m =>
    m.numero_os.toString().includes(searchTerm) ||
    m.id.toString().includes(searchTerm) ||
    m.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (maintenance: any) => {
    setEditingMaintenance(maintenance.id);
    setFormData({
      equipment_id: maintenance.equipment_id || "",
      data_abertura: maintenance.date ? new Date(maintenance.date).toISOString().split('T')[0] : "",
      data_termino: maintenance.data_termino ? new Date(maintenance.data_termino).toISOString().split('T')[0] : "",
      tecnico_responsavel: maintenance.tecnico_responsavel || "",
      problema: maintenance.problema || "",
      observacoes: maintenance.observacoes || "",
      status: maintenance.statusRaw || "pendente",
    });
    setShowForm(true);
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMaintenance(null);
    setFormData({
      equipment_id: "",
      data_abertura: "",
      data_termino: "",
      tecnico_responsavel: "",
      problema: "",
      observacoes: "",
      status: "pendente",
    });
  };

  const handleDelete = async (maintenanceId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para excluir manutenções.",
        variant: "destructive",
      });
      return;
    }

    // Confirmar exclusão
    if (!confirm('Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenances')
        .delete()
        .eq('id', maintenanceId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao excluir manutenção:', error);
        toast({
          title: "Erro ao excluir",
          description: error.message || "Não foi possível excluir a manutenção.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Manutenção excluída!",
        description: "A ordem de serviço foi excluída com sucesso.",
      });

      // Recarregar lista de manutenções
      await loadMaintenances();
    } catch (error) {
      console.error('Erro ao excluir manutenção:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a manutenção.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para registrar manutenções.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.equipment_id) {
      toast({
        title: "Erro",
        description: "Selecione um equipamento.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingMaintenance) {
        // Preparar dados de atualização
        const updateData: any = {
          equipment_id: formData.equipment_id,
          data_abertura: formData.data_abertura || null,
          data_termino: formData.data_termino || null,
          tecnico_responsavel: formData.tecnico_responsavel || null,
          problema: formData.problema || null,
          problema_relatado: formData.problema || null,
          observacoes: formData.observacoes || null,
          status: formData.status || 'pendente',
        };

        // Se o status for "concluida" e não tiver data_conclusao, preencher automaticamente
        if (formData.status === 'concluida') {
          // Usar data_termino se existir, senão usar data atual
          updateData.data_conclusao = formData.data_termino || new Date().toISOString().split('T')[0];
        }

        // Atualizar manutenção existente
        const { error } = await supabase
          .from('maintenances')
          .update(updateData)
          .eq('id', editingMaintenance)
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao atualizar manutenção:', error);
          toast({
            title: "Erro ao atualizar",
            description: error.message || "Não foi possível atualizar a manutenção.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Manutenção atualizada!",
          description: "A ordem de serviço foi atualizada com sucesso.",
        });
      } else {
        // Criar nova manutenção
        const { error } = await supabase
          .from('maintenances')
          .insert({
            user_id: user.id,
            equipment_id: formData.equipment_id,
            data_abertura: formData.data_abertura || new Date().toISOString().split('T')[0],
            data_termino: formData.data_termino || null,
            tecnico_responsavel: formData.tecnico_responsavel || null,
            problema: formData.problema || null,
            problema_relatado: formData.problema || null,
            observacoes: formData.observacoes || null,
            status: formData.status || 'pendente',
          });

        if (error) {
          console.error('Erro ao registrar manutenção:', error);
          toast({
            title: "Erro ao registrar",
            description: error.message || "Não foi possível registrar a manutenção.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Manutenção registrada!",
          description: "A ordem de serviço foi criada com sucesso.",
        });
      }

      // Limpar formulário
      setFormData({
        equipment_id: "",
        data_abertura: "",
        data_termino: "",
        tecnico_responsavel: "",
        problema: "",
        observacoes: "",
        status: "pendente",
      });
      setEditingMaintenance(null);
      setShowForm(false);

      // Recarregar lista de manutenções
      await loadMaintenances();
    } catch (error) {
      console.error('Erro ao registrar manutenção:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a manutenção.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold text-foreground">Manutenções</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Manutenção
          </Button>
        </div>
      </header>

      <div className="p-6">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingMaintenance ? 'Editar Manutenção' : 'Registrar Nova Manutenção'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="equipment">Equipamento</Label>
                    <Select 
                      value={formData.equipment_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.length === 0 ? (
                          <SelectItem value="" disabled>Nenhum equipamento cadastrado</SelectItem>
                        ) : (
                          equipments.map((equipment) => (
                            <SelectItem key={equipment.id} value={equipment.id}>
                              {equipment.nome} {equipment.modelo ? `- ${equipment.modelo}` : ''} {equipment.customers ? `- ${equipment.customers.nome_empresa}` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data de Abertura</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.data_abertura}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_abertura: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_termino">Data de Término</Label>
                    <Input 
                      id="data_termino" 
                      type="date" 
                      value={formData.data_termino}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_termino: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tecnico">Técnico Responsável</Label>
                    <Input 
                      id="tecnico" 
                      type="text" 
                      placeholder="Nome do técnico responsável"
                      value={formData.tecnico_responsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, tecnico_responsavel: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="issue">Problema Relatado</Label>
                    <Textarea 
                      id="issue" 
                      placeholder="Descreva o problema..." 
                      value={formData.problema}
                      onChange={(e) => setFormData(prev => ({ ...prev, problema: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea 
                      id="observations" 
                      placeholder="Observações técnicas..." 
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluida">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingMaintenance ? "Atualizar" : "Registrar"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ordens de Serviço</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar OS..."
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filteredMaintenances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhuma manutenção encontrada' : 'Nenhuma manutenção registrada ainda'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-foreground">OS</th>
                      <th className="text-left p-3 font-medium text-foreground">Equipamento</th>
                      <th className="text-left p-3 font-medium text-foreground">Cliente</th>
                      <th className="text-left p-3 font-medium text-foreground">Problema Relatado</th>
                      <th className="text-left p-3 font-medium text-foreground">Observações</th>
                      <th className="text-left p-3 font-medium text-foreground">Data Abertura</th>
                      <th className="text-left p-3 font-medium text-foreground">Data Término</th>
                      <th className="text-left p-3 font-medium text-foreground">Técnico</th>
                      <th className="text-left p-3 font-medium text-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaintenances.map((maintenance) => (
                    <tr key={maintenance.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">#{maintenance.numero_os || maintenance.id}</span>
                        </div>
                      </td>
                      <td className="p-3 text-foreground">
                        {maintenance.equipment} {maintenance.equipmentModel ? `- ${maintenance.equipmentModel}` : ''}
                      </td>
                      <td className="p-3 text-foreground">{maintenance.customer}</td>
                      <td className="p-3 text-muted-foreground text-sm max-w-xs truncate" title={maintenance.problema}>
                        {maintenance.problema || '-'}
                      </td>
                      <td className="p-3 text-muted-foreground text-sm max-w-xs truncate" title={maintenance.observacoes}>
                        {maintenance.observacoes || '-'}
                      </td>
                      <td className="p-3 text-muted-foreground text-sm">
                        {maintenance.data_abertura ? new Date(maintenance.data_abertura).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-3 text-muted-foreground text-sm">
                        {maintenance.data_termino ? new Date(maintenance.data_termino).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-3 text-foreground text-sm">
                        {maintenance.tecnico_responsavel || '-'}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                          maintenance.statusRaw === "concluida" 
                            ? "bg-green-100 text-green-600 border border-green-300" 
                            : "bg-red-100 text-red-600 border border-red-300"
                        }`}>
                          {maintenance.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(maintenance)}
                            title="Editar manutenção"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(maintenance.id)}
                            title="Excluir manutenção"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Maintenance;
