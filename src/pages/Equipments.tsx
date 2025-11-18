import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, Search, Edit, Check, ChevronsUpDown, Building2, QrCode, Download, Printer } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Equipments = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [openCustomerSelect, setOpenCustomerSelect] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [editingEquipment, setEditingEquipment] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedEquipmentForQR, setSelectedEquipmentForQR] = useState<any>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    numero_serie: "",
    sku: "",
    customer_id: "",
    modelo: "",
    localizacao: "",
    garantia_validade: "",
    quantidade: "1",
  });

  useEffect(() => {
    if (user) {
      loadEquipments();
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;

    try {
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('id, nome_empresa')
        .eq('user_id', user.id)
        .order('nome_empresa', { ascending: true });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        return;
      }

      setCustomers(customersData || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadEquipments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipments')
        .select('*, customers(nome_empresa)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar equipamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os equipamentos.",
          variant: "destructive",
        });
        return;
      }

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const equipmentsList = (data || []).map((eq: any) => {
        let warranty = "Sem garantia";
        let warrantyStatus = "none";
        
        if (eq.garantia_validade) {
          const warrantyDate = new Date(eq.garantia_validade);
          if (warrantyDate < now) {
            warranty = "Garantia Vencida";
            warrantyStatus = "expired";
          } else if (warrantyDate <= thirtyDaysFromNow) {
            const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            warranty = `Expira em ${daysUntilExpiry} dias`;
            warrantyStatus = "expiring";
          } else {
            warranty = "Garantia Válida";
            warrantyStatus = "valid";
          }
        }

        return {
          id: eq.id,
          name: eq.nome,
          serial: eq.numero_serie || '',
          sku: eq.sku || '',
          customer: eq.customers?.nome_empresa || '',
          customer_id: eq.customer_id || '',
          model: eq.modelo || '',
          warranty,
          warrantyStatus,
          location: eq.localizacao || '',
          garantia_validade: eq.garantia_validade || '',
          quantidade: eq.quantidade || 1,
        };
      });

      setEquipments(equipmentsList);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipments = equipments.filter(eq =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (equipment: any) => {
    setEditingEquipment(equipment.id);
    setFormData({
      nome: equipment.name || "",
      numero_serie: equipment.serial || "",
      sku: equipment.sku || "",
      customer_id: equipment.customer_id || "",
      modelo: equipment.model || "",
      localizacao: equipment.location || "",
      garantia_validade: equipment.garantia_validade ? equipment.garantia_validade.split('T')[0] : "",
      quantidade: equipment.quantidade?.toString() || "1",
    });
    setSelectedCustomerId(equipment.customer_id || "");
    setShowForm(true);
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEquipment(null);
    setFormData({
      nome: "",
      numero_serie: "",
      sku: "",
      customer_id: "",
      modelo: "",
      localizacao: "",
      garantia_validade: "",
      quantidade: "1",
    });
    setSelectedCustomerId("");
  };

  const handleShowQRCode = (equipment: any) => {
    setSelectedEquipmentForQR(equipment);
    setShowQRCode(true);
  };

  const handleDownloadQRCode = () => {
    if (!selectedEquipmentForQR) return;

    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QRCode-${selectedEquipmentForQR.sku || selectedEquipmentForQR.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQRCode = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para cadastrar equipamentos.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.customer_id) {
      toast({
        title: "Erro",
        description: "Selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingEquipment) {
        // Atualizar equipamento existente
        const { error } = await supabase
          .from('equipments')
          .update({
            customer_id: formData.customer_id,
            nome: formData.nome,
            numero_serie: formData.numero_serie || null,
            sku: formData.sku || null,
            modelo: formData.modelo || null,
            localizacao: formData.localizacao || null,
            garantia_validade: formData.garantia_validade || null,
            quantidade: parseInt(formData.quantidade) || 1,
          })
          .eq('id', editingEquipment)
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao atualizar equipamento:', error);
          toast({
            title: "Erro ao atualizar",
            description: error.message || "Não foi possível atualizar o equipamento.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Equipamento atualizado!",
          description: "As informações do equipamento foram atualizadas com sucesso.",
        });
      } else {
        // Criar novo equipamento
        // Gerar SKU automático se não fornecido
        let skuValue = formData.sku?.trim() || null;
        if (!skuValue) {
          // Gerar SKU baseado no timestamp + random
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          skuValue = `EQ-${timestamp}-${random}`;
        }

        const { data: insertedData, error } = await supabase
          .from('equipments')
          .insert({
            user_id: user.id,
            customer_id: formData.customer_id,
            nome: formData.nome,
            numero_serie: formData.numero_serie || null,
            sku: skuValue,
            modelo: formData.modelo || null,
            localizacao: formData.localizacao || null,
            garantia_validade: formData.garantia_validade || null,
            quantidade: parseInt(formData.quantidade) || 1,
          })
          .select()
          .single();

        // Se houver erro de SKU duplicado, tentar novamente com outro SKU
        if (error) {
          if (error.code === '23505' && error.message.includes('sku')) {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            const newSku = `EQ-${timestamp}-${random}`;
            
            const { error: retryError } = await supabase
              .from('equipments')
              .insert({
                user_id: user.id,
                customer_id: formData.customer_id,
                nome: formData.nome,
                numero_serie: formData.numero_serie || null,
                sku: newSku,
                modelo: formData.modelo || null,
                localizacao: formData.localizacao || null,
                garantia_validade: formData.garantia_validade || null,
                quantidade: parseInt(formData.quantidade) || 1,
              });
            
            if (retryError) {
              console.error('Erro ao cadastrar equipamento:', retryError);
              toast({
                title: "Erro ao cadastrar",
                description: retryError.message || "Não foi possível cadastrar o equipamento.",
                variant: "destructive",
              });
              return;
            }
          } else {
            console.error('Erro ao cadastrar equipamento:', error);
            toast({
              title: "Erro ao cadastrar",
              description: error.message || "Não foi possível cadastrar o equipamento.",
              variant: "destructive",
            });
            return;
          }
        }

        toast({
          title: "Equipamento cadastrado!",
          description: "O equipamento foi adicionado com sucesso.",
        });
      }

      // Limpar formulário
      setFormData({
        nome: "",
        numero_serie: "",
        sku: "",
        customer_id: "",
        modelo: "",
        localizacao: "",
        garantia_validade: "",
        quantidade: "1",
      });
      setSelectedCustomerId("");
      setEditingEquipment(null);
      setShowForm(false);

      // Recarregar lista de equipamentos
      await loadEquipments();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o equipamento.",
        variant: "destructive",
      });
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const getWarrantyBadgeClass = (status: string) => {
    switch (status) {
      case "expired":
        return "bg-red-100 text-red-600 border border-red-300";
      case "expiring":
        return "bg-yellow-100 text-yellow-600 border border-yellow-300";
      case "valid":
        return "bg-green-100 text-green-600 border border-green-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Equipamentos</h1>
              <p className="text-sm text-muted-foreground">Gerencie todos os equipamentos e suas garantias</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        </div>
      </header>

      <div className="p-6">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingEquipment ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Equipamento</Label>
                    <Input 
                      id="name" 
                      placeholder="Ex: Notebook Dell Inspiron" 
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serial">Número de Série</Label>
                    <Input 
                      id="serial" 
                      placeholder="SN123456" 
                      value={formData.numero_serie}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU/ID (deixe em branco para gerar automaticamente)</Label>
                    <Input 
                      id="sku" 
                      placeholder="EQ-ABC123 ou deixe em branco" 
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer">Cliente</Label>
                    <Popover open={openCustomerSelect} onOpenChange={setOpenCustomerSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCustomerSelect}
                          className="w-full justify-between"
                        >
                          {selectedCustomer
                            ? selectedCustomer.nome_empresa
                            : "Selecione um cliente..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.nome_empresa}
                                  onSelect={() => {
                                    setSelectedCustomerId(customer.id);
                                    setFormData(prev => ({ ...prev, customer_id: customer.id }));
                                    setOpenCustomerSelect(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <Building2 className="mr-2 h-4 w-4" />
                                  {customer.nome_empresa}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input 
                      id="model" 
                      placeholder="Modelo do equipamento" 
                      value={formData.modelo}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input 
                      id="location" 
                      placeholder="Local onde está instalado" 
                      value={formData.localizacao}
                      onChange={(e) => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input 
                      id="quantidade" 
                      type="number" 
                      min="1"
                      placeholder="1" 
                      value={formData.quantidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty">Validade da Garantia</Label>
                    <Input 
                      id="warranty" 
                      type="date" 
                      value={formData.garantia_validade}
                      onChange={(e) => setFormData(prev => ({ ...prev, garantia_validade: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingEquipment ? "Atualizar" : "Cadastrar"}
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
              <div>
                <CardTitle>Lista de Equipamentos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {equipments.length} {equipments.length === 1 ? 'equipamento cadastrado' : 'equipamentos cadastrados'}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipamentos..."
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
            ) : filteredEquipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado ainda'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">ID/SKU</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Equipamento</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Cliente</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Modelo</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Quantidade</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Status da Garantia</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Localização</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipments.map((equipment) => (
                    <tr key={equipment.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <span className="font-medium text-foreground">{equipment.sku || equipment.id}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{equipment.name}</p>
                            <p className="text-xs text-muted-foreground">{equipment.serial}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-foreground">{equipment.customer}</td>
                      <td className="p-3 text-muted-foreground">{equipment.model}</td>
                      <td className="p-3 text-foreground font-medium">{equipment.quantidade || 1}</td>
                      <td className="p-3">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getWarrantyBadgeClass(equipment.warrantyStatus)}`}>
                          {equipment.warranty}
                        </span>
                      </td>
                      <td className="p-3 text-foreground">{equipment.location}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleShowQRCode(equipment)}
                            title="Gerar QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(equipment)}
                            title="Editar equipamento"
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

        {/* Dialog para exibir QR Code */}
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code do Equipamento</DialogTitle>
              <DialogDescription>
                Escaneie este QR code para acessar as informações do equipamento. Você pode imprimir ou baixar a imagem.
              </DialogDescription>
            </DialogHeader>
            {selectedEquipmentForQR && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={selectedEquipmentForQR.sku || selectedEquipmentForQR.id}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{selectedEquipmentForQR.name}</p>
                  <p className="text-sm text-muted-foreground">SKU/ID: {selectedEquipmentForQR.sku || selectedEquipmentForQR.id}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadQRCode}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handlePrintQRCode}
                    className="flex-1"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Equipments;
