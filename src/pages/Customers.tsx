import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2, Search, QrCode, Edit, Mail, Phone } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const Customers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome_empresa: "",
    cnpj: "",
    contato: "",
    email: "",
    telefone: "",
    endereco: "",
  });

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os clientes.",
          variant: "destructive",
        });
        return;
      }

      // Buscar contagem de equipamentos para cada cliente
      const customersWithCount = await Promise.all(
        (customersData || []).map(async (customer: any) => {
          const { count } = await supabase
            .from('equipments')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.id);

          return {
            id: customer.id,
            company: customer.nome_empresa,
            document: customer.cnpj || '',
            contact: customer.contato || '',
            email: customer.email || '',
            phone: customer.telefone || '',
            endereco: customer.endereco || '',
            equipments: count || 0,
            status: "Ativo"
          };
        })
      );

      setCustomers(customersWithCount);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.document.includes(searchTerm) ||
    customer.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer.id);
    setFormData({
      nome_empresa: customer.company || "",
      cnpj: customer.document || "",
      contato: customer.contact || "",
      email: customer.email || "",
      telefone: customer.phone || "",
      endereco: customer.endereco || "",
    });
    setShowForm(true);
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({
      nome_empresa: "",
      cnpj: "",
      contato: "",
      email: "",
      telefone: "",
      endereco: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para cadastrar clientes.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      if (editingCustomer) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('customers')
          .update({
            nome_empresa: formData.nome_empresa || '',
            cnpj: formData.cnpj || null,
            contato: formData.contato || null,
            email: formData.email || null,
            telefone: formData.telefone || null,
            endereco: formData.endereco || null,
          })
          .eq('id', editingCustomer)
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao atualizar cliente:', error);
          toast({
            title: "Erro ao atualizar",
            description: error.message || "Não foi possível atualizar o cliente.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Cliente atualizado!",
          description: "As informações do cliente foram atualizadas com sucesso.",
        });
      } else {
        // Criar novo cliente
        const { data, error } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            nome_empresa: formData.nome_empresa || '',
            cnpj: formData.cnpj || null,
            contato: formData.contato || null,
            email: formData.email || null,
            telefone: formData.telefone || null,
            endereco: formData.endereco || null,
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao cadastrar cliente:', error);
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Não foi possível cadastrar o cliente.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Cliente cadastrado!",
          description: "O cliente foi adicionado com sucesso.",
        });
      }

      // Limpar formulário
      setFormData({
        nome_empresa: "",
        cnpj: "",
        contato: "",
        email: "",
        telefone: "",
        endereco: "",
      });
      setShowForm(false);
      setEditingCustomer(null);

      // Recarregar lista de clientes
      await loadCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o cliente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground">Gerencie informações dos seus clientes</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </header>

      <div className="p-6">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Nome da Empresa</Label>
                    <Input 
                      id="company" 
                      placeholder="Ex: TechCorp Ltda" 
                      value={formData.nome_empresa}
                      onChange={(e) => handleInputChange('nome_empresa', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">CNPJ</Label>
                    <Input 
                      id="document" 
                      placeholder="00.000.000/0000-00" 
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Nome do Contato</Label>
                    <Input 
                      id="contact" 
                      placeholder="Ex: João Silva" 
                      value={formData.contato}
                      onChange={(e) => handleInputChange('contato', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="email@exemplo.com" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      placeholder="(11) 98765-4321" 
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input 
                      id="address" 
                      placeholder="Rua, número, bairro" 
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting 
                      ? (editingCustomer ? "Atualizando..." : "Cadastrando...") 
                      : (editingCustomer ? "Atualizar" : "Cadastrar")
                    }
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Clientes</p>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? "..." : customers.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Clientes cadastrados</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? "..." : customers.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Com contratos vigentes</p>
                </div>
                <div className="p-3 rounded-lg bg-chart-2/10">
                  <Building2 className="h-6 w-6 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Equipamentos</p>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? "..." : customers.reduce((sum, c) => sum + c.equipments, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Equipamentos gerenciados</p>
                </div>
                <div className="p-3 rounded-lg bg-chart-4/10">
                  <Building2 className="h-6 w-6 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Clientes</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {customers.length} {customers.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clientes..."
                    className="w-64 border-0 bg-transparent focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">ID</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Empresa</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Contato</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Email</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Telefone</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Equipamentos</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <span className="font-medium text-foreground">{customer.id}</span>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-foreground">{customer.company}</p>
                          <p className="text-xs text-muted-foreground">{customer.document}</p>
                        </div>
                      </td>
                      <td className="p-3 text-foreground">{customer.contact}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium text-foreground">{customer.equipments}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-chart-2/10 text-chart-2">
                          {customer.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="QR Code (em breve)"
                            disabled
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(customer)}
                            title="Editar cliente"
                          >
                            <Edit className="h-4 w-4" />
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

export default Customers;
