"use client";

// External packages
import {
  ColorField,
  NumberField,
  TextField,
} from "@paths-design/design-system";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import styles from "./page.module.scss";
import { TopNavigation } from "@/ui/assemblies/TopNavigation";
import { AlignmentGrid } from "@/ui/composers/AlignmentGrid";
import { CollapsiblePanel } from "@/ui/composers/CollapsiblePanel";
import { KeyboardShortcutsModal } from "@/ui/composers/KeyboardShortcutsModal";
import { ButtonGroup } from "@/ui/compounds/ButtonGroup";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/compounds/Card";
import { FileMetadata } from "@/ui/compounds/FileMetadata";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/Alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/primitives/AlertDialog";
import { AspectRatio } from "@/ui/primitives/AspectRatio";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/primitives/Avatar";
import { Badge } from "@/ui/primitives/Badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/primitives/Breadcrumb";
import { Button } from "@/ui/primitives/Button";
import { Checkbox } from "@/ui/primitives/Checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/primitives/Collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/primitives/ContextMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/primitives/Dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/ui/primitives/Drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/primitives/DropdownMenu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/primitives/Empty";
import { Field } from "@/ui/primitives/Field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/primitives/Form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/ui/primitives/HoverCard";
import { Input } from "@/ui/primitives/Input";
import { InputGroup } from "@/ui/primitives/InputGroup";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/ui/primitives/InputOtp";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/ui/primitives/Item";
import { Kbd, KbdGroup } from "@/ui/primitives/Kbd";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/ui/primitives/Menubar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/ui/primitives/NavigationMenu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/primitives/Pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/primitives/Popover";
import { Progress } from "@/ui/primitives/Progress";
import { RadioGroup, RadioGroupItem } from "@/ui/primitives/RadioGroup";
import { ScrollArea } from "@/ui/primitives/ScrollArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/Select";
import { Separator } from "@/ui/primitives/Separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/primitives/Sheet";
import { Skeleton } from "@/ui/primitives/Skeleton";
// import { Toaster } from "@/ui/primitives/Sonner";
import { Switch } from "@/ui/primitives/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/primitives/Tabs";
import { Textarea } from "@/ui/primitives/Textarea";
// import { ThemeProvider } from "@/ui/primitives/ThemeProvider";
// import { ToggleGroup, ToggleGroupItem } from "@/ui/primitives/ToggleGroup";
// import { useIsMobile } from "@/ui/primitives/UseMobile";
// Note: ZoomControls and PropertiesPanel require CanvasProvider context
// Using simplified versions for showcase

export function ComponentShowcaseClient() {
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [collapsiblePanelOpen, setCollapsiblePanelOpen] = useState(true);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inputOtpValue, setInputOtpValue] = useState("");
  const [radioGroupValue, setRadioGroupValue] = useState("option1");
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  // const [resizableLayout, setResizableLayout] = useState([50, 50]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  // const [date, setDate] = useState<Date | undefined>(new Date());
  const [colorFieldValue, setColorFieldValue] = useState("#3b82f6");
  const [numberFieldValue, setNumberFieldValue] = useState<number>(42);
  const [textFieldValue, setTextFieldValue] = useState("Hello World");

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      bio: "",
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/components-showcase">Component Showcase</Link>
          </nav>
          <h1 className={styles.title}>Component Showcase</h1>
          <p className={styles.description}>
            Visual verification of all migrated SCSS components. Each section
            displays component variants, states, and styling to ensure design
            consistency.
          </p>
        </div>

        {/* Primitives Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Primitives</h2>
            <p className={styles.sectionDescription}>Basic building blocks</p>
          </div>

          {/* Buttons */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Button Variants</h3>
            <div className={styles.grid}>
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Button Sizes</h3>
            <div className={styles.buttonRow}>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Inputs */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Input States</h3>
            <div className={styles.gridCols2}>
              <div className={styles.spaceY4}>
                <label className="text-sm font-medium">Default Input</label>
                <Input placeholder="Enter text..." />
              </div>
              <div className={styles.spaceY4}>
                <label className="text-sm font-medium">Disabled Input</label>
                <Input placeholder="Disabled..." disabled />
              </div>
            </div>
            <div className={styles.spaceY4}>
              <label className="text-sm font-medium">Textarea</label>
              <Textarea placeholder="Enter longer text..." />
            </div>
          </div>

          {/* Form Controls */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Form Controls</h3>
            <div className={styles.gridCols2}>
              <div className={styles.spaceY8}>
                <h4 className="text-lg font-medium">Checkboxes</h4>
                <div className={styles.spaceY4}>
                  <div className={styles.checkboxRow}>
                    <Checkbox id="check1" />
                    <label htmlFor="check1">Default checkbox</label>
                  </div>
                  <div className={styles.checkboxRow}>
                    <Checkbox id="check2" defaultChecked />
                    <label htmlFor="check2">Checked checkbox</label>
                  </div>
                  <div className={styles.checkboxRow}>
                    <Checkbox id="check3" disabled />
                    <label htmlFor="check3">Disabled checkbox</label>
                  </div>
                </div>
              </div>
              <div className={styles.spaceY8}>
                <h4 className="text-lg font-medium">Switches</h4>
                <div className={styles.spaceY4}>
                  <div className={styles.checkboxRow}>
                    <Switch id="switch1" />
                    <label htmlFor="switch1">Default switch</label>
                  </div>
                  <div className={styles.checkboxRow}>
                    <Switch id="switch2" defaultChecked />
                    <label htmlFor="switch2">On switch</label>
                  </div>
                  <div className={styles.checkboxRow}>
                    <Switch id="switch3" disabled />
                    <label htmlFor="switch3">Disabled switch</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading States */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Loading States</h3>
            <div className={styles.gridCols2}>
              <div className={styles.spaceY8}>
                <h4 className="text-lg font-medium">Progress</h4>
                <div className={styles.spaceY4}>
                  <Progress value={33} className="w-full" />
                  <Progress value={66} className="w-full" />
                  <Progress value={100} className="w-full" />
                </div>
              </div>
              <div className={styles.spaceY8}>
                <h4 className="text-lg font-medium">Skeleton</h4>
                <div className={styles.spaceY4}>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Alert Variants</h3>
            <div className={styles.spaceY8}>
              <Alert>
                <AlertTitle>Default Alert</AlertTitle>
                <AlertDescription>
                  This is a default alert message.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Destructive Alert</AlertTitle>
                <AlertDescription>
                  This is a destructive alert message.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Avatar & Badge */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Avatar & Badge</h3>
            <div className={styles.flex}>
              <Avatar>
                <AvatarImage src="https://github.com/darianrosebrook.png" />
                <AvatarFallback>DR</AvatarFallback>
              </Avatar>
              <div className={styles.flex}>
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
          </div>

          {/* Select */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Select</h3>
            <div className={styles.gridCols2}>
              <div className={styles.spaceY4}>
                <label className="text-sm font-medium">Default Select</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.spaceY4}>
                <label className="text-sm font-medium">Disabled Select</label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Disabled" />
                  </SelectTrigger>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tabs</h3>
            <Tabs defaultValue="tab1" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className={styles.p8}>
                <p className="text-sm text-muted-foreground">
                  This is the content for Tab 1. You can put any content here.
                </p>
              </TabsContent>
              <TabsContent value="tab2" className={styles.p8}>
                <p className="text-sm text-muted-foreground">
                  This is the content for Tab 2. Different content for each tab.
                </p>
              </TabsContent>
              <TabsContent value="tab3" className={styles.p8}>
                <p className="text-sm text-muted-foreground">
                  This is the content for Tab 3. Tabs help organize content.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Compounds Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Compounds</h2>
            <p className={styles.sectionDescription}>Primitive groupings</p>
          </div>

          {/* Card */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Card Variants</h3>
            <div className={styles.gridCols3}>
              <Card>
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>A basic card component</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Card content goes here
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Card with Actions</CardTitle>
                  <CardDescription>Interactive card example</CardDescription>
                </CardHeader>
                <CardContent className={styles.spaceY8}>
                  <p className="text-sm text-muted-foreground">
                    This card demonstrates interactive elements.
                  </p>
                  <div className={styles.flex}>
                    <Button size="sm">Action 1</Button>
                    <Button size="sm" variant="outline">
                      Action 2
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Button Group */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Button Group</h3>
            <div className={styles.spaceY8}>
              <ButtonGroup orientation="horizontal">
                <Button variant="outline">Left</Button>
                <Button variant="outline">Center</Button>
                <Button variant="outline">Right</Button>
              </ButtonGroup>
              <ButtonGroup orientation="vertical">
                <Button variant="outline">Top</Button>
                <Button variant="outline">Middle</Button>
                <Button variant="outline">Bottom</Button>
              </ButtonGroup>
            </div>
          </div>

          {/* File Metadata */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>File Metadata</h3>
            <div className={styles.flex}>
              <FileMetadata
                name="Design System Showcase"
                layers={156}
                components={47}
                lastModified="2 hours ago"
              />
            </div>
          </div>

          {/* Color Field */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Color Field</h3>
            <div className={styles.gridCols2}>
              <ColorField
                label="Primary Color"
                value={colorFieldValue}
                onChange={setColorFieldValue}
                helperText="Choose the primary theme color"
              />
              <ColorField
                label="Accent Color"
                value="#10b981"
                onChange={(value) =>
                  console.info("Accent color changed:", value)
                }
                helperText="Choose an accent color for highlights"
                showTextInput={false}
              />
            </div>
          </div>

          {/* Number Field */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Number Field</h3>
            <div className={styles.gridCols2}>
              <NumberField
                label="Width"
                value={numberFieldValue}
                onChange={setNumberFieldValue}
                min={0}
                max={1000}
                step={1}
                helperText="Enter width in pixels"
                showValue={true}
              />
              <NumberField
                label="Opacity"
                value={75}
                onChange={(value) => console.info("Opacity changed:", value)}
                min={0}
                max={100}
                step={5}
                helperText="Set element opacity percentage"
              />
            </div>
          </div>

          {/* Text Field */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Text Field</h3>
            <div className={styles.gridCols2}>
              <TextField
                label="Email Address"
                type="email"
                value={textFieldValue}
                onChange={setTextFieldValue}
                helperText="We'll use this for account notifications"
                required
              />
              <TextField
                label="Search"
                type="search"
                placeholder="Search for components..."
                helperText="Type to search through available components"
              />
            </div>
          </div>
        </section>

        {/* Composers Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Composers</h2>
            <p className={styles.sectionDescription}>Reusable UI patterns</p>
          </div>

          {/* Alignment Grid */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Alignment Grid</h3>
            <div className={styles.bgMuted20}>
              <AlignmentGrid
                onAlign={(alignment) => console.info("Alignment:", alignment)}
                currentAlignment={{ horizontal: "center", vertical: "middle" }}
              />
            </div>
          </div>

          {/* Collapsible Panel */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Collapsible Panel</h3>
            <CollapsiblePanel
              side="right"
              defaultCollapsed={false}
              onToggle={setCollapsiblePanelOpen}
              collapsedContent={<div className={styles.p8}>Collapsed</div>}
            >
              <div className={styles.p8}>
                <h4 className="text-lg font-medium">Panel Content</h4>
                <p className="text-muted-foreground">
                  This panel can be collapsed and expanded. It demonstrates the
                  collapsible composer pattern.
                </p>
                <div className={styles.gridCols2}>
                  <Button>Action 1</Button>
                  <Button variant="outline">Action 2</Button>
                </div>
              </div>
            </CollapsiblePanel>
          </div>

          {/* Zoom Controls */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Zoom Controls</h3>
            <div className={styles.bgMuted20}>
              <div className={styles.flex}>
                <Button variant="ghost" size="sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </Button>
                <span className="text-sm font-medium">100%</span>
                <Button variant="ghost" size="sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Full ZoomControls component requires CanvasProvider
                context
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts Modal Trigger */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Keyboard Shortcuts</h3>
            <Button onClick={() => setShortcutsModalOpen(true)}>
              Open Keyboard Shortcuts Modal
            </Button>
          </div>
        </section>

        {/* Layout & Modals Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Layout & Modals</h2>
            <p className={styles.sectionDescription}>
              Modal dialogs and overlays
            </p>
          </div>

          {/* Aspect Ratio */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Aspect Ratio</h3>
            <div className={styles.gridCols3}>
              <div className={styles.aspectRatioContainer}>
                <AspectRatio ratio={16 / 9}>
                  <div className={styles.aspectRatioContent}>16:9</div>
                </AspectRatio>
              </div>
              <div className={styles.aspectRatioContainer}>
                <AspectRatio ratio={4 / 3}>
                  <div className={styles.aspectRatioContent}>4:3</div>
                </AspectRatio>
              </div>
              <div className={styles.aspectRatioContainer}>
                <AspectRatio ratio={1}>
                  <div className={styles.aspectRatioContent}>1:1</div>
                </AspectRatio>
              </div>
            </div>
          </div>

          {/* Alert Dialog */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Alert Dialog</h3>
            <AlertDialog
              open={alertDialogOpen}
              onOpenChange={setAlertDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="outline">Open Alert Dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Dialog */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dialog</h3>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                  </DialogDescription>
                </DialogHeader>
                <div className={styles.spaceY8}>
                  <div className={styles.spaceY4}>
                    <label className="text-sm font-medium">Name</label>
                    <Input value="John Doe" />
                  </div>
                  <div className={styles.spaceY4}>
                    <label className="text-sm font-medium">Email</label>
                    <Input value="john@example.com" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Drawer */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Drawer</h3>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline">Open Drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Move Goal</DrawerTitle>
                  <DrawerDescription>
                    Set your daily activity goal.
                  </DrawerDescription>
                </DrawerHeader>
                <div className={styles.p8}>
                  <div className={styles.spaceY4}>
                    <label className="text-sm font-medium">Goal</label>
                    <Input placeholder="Enter your goal..." />
                  </div>
                </div>
                <DrawerFooter>
                  <Button>Submit</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Sheet */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Sheet</h3>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Are you absolutely sure?</SheetTitle>
                  <SheetDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </SheetDescription>
                </SheetHeader>
                <div className={styles.spaceY8}>
                  <div className={styles.spaceY4}>
                    <label className="text-sm font-medium">Reason</label>
                    <Textarea placeholder="Please provide a reason..." />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </SheetClose>
                  <Button>Continue</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </section>

        {/* Navigation Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Navigation</h2>
            <p className={styles.sectionDescription}>
              Navigation and breadcrumb components
            </p>
          </div>

          {/* Breadcrumb */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Breadcrumb</h3>
            <div className={styles.spaceY4}>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/components">
                      Components
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Navigation Menu</h3>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/"
                          >
                            <div className="mb-2 mt-4 text-lg font-medium">
                              shadcn/ui
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Beautifully designed components built with Radix
                              UI and Tailwind CSS.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="/docs"
                          >
                            <div className="text-sm font-medium leading-none">
                              Documentation
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Learn how to use our components.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="/themes"
                          >
                            <div className="text-sm font-medium leading-none">
                              Themes
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Customize your components.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="/docs/primitives/typography"
                          >
                            <div className="text-sm font-medium leading-none">
                              Typography
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Styles for headings, paragraphs, lists...etc
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="/docs/primitives/layout"
                          >
                            <div className="text-sm font-medium leading-none">
                              Layout
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Components for layout and spacing.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/docs">
                    Documentation
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Pagination */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Pagination</h3>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Menubar */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Menubar</h3>
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    New Tab <MenubarShortcut>⌘T</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    New Window <MenubarShortcut>⌘N</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem disabled>New Incognito Window</MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Share</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>Email link</MenubarItem>
                      <MenubarItem>Messages</MenubarItem>
                      <MenubarItem>Notes</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSeparator />
                  <MenubarItem>
                    Print... <MenubarShortcut>⌘P</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>
                    Find <MenubarShortcut>⌘F</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>
                    Replace <MenubarShortcut>⌘H</MenubarShortcut>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent>
                  <MenubarCheckboxItem>
                    Always Show Bookmarks Bar
                  </MenubarCheckboxItem>
                  <MenubarCheckboxItem checked>
                    Always Show Full URLs
                  </MenubarCheckboxItem>
                  <MenubarSeparator />
                  <MenubarItem inset>
                    Reload <MenubarShortcut>⌘R</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem disabled inset>
                    Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem inset>Toggle Fullscreen</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Profiles</MenubarTrigger>
                <MenubarContent>
                  <MenubarRadioGroup value="benoit">
                    <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                    <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                    <MenubarRadioItem value="luis">Luis</MenubarRadioItem>
                  </MenubarRadioGroup>
                  <MenubarSeparator />
                  <MenubarItem inset>Edit...</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem inset>Add Profile...</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </section>

        {/* Forms Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Forms</h2>
            <p className={styles.sectionDescription}>
              Form inputs and validation components
            </p>
          </div>

          {/* Form */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Form with Validation</h3>
            <div className={styles.maxW2xl}>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => console.info(data))}
                  className={styles.spaceY6}
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="shadcn" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          We'll use this email to send you updates.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a little bit about yourself"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          You can write a short bio about yourself.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Submit</Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Field */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Field</h3>
            <div className={styles.gridCols2}>
              <Field
                label="Email Address"
                description="We'll never share your email"
              >
                <Input type="email" placeholder="Enter your email" />
              </Field>
              <Field
                label="Password"
                description="Must be at least 8 characters"
              >
                <Input type="password" placeholder="Enter your password" />
              </Field>
            </div>
          </div>

          {/* Input Group */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Input Group</h3>
            <div className={styles.spaceY4}>
              <InputGroup>
                <span className="text-sm text-muted-foreground">$</span>
                <Input placeholder="0.00" />
              </InputGroup>
              <InputGroup>
                <Input placeholder="Enter your website" />
                <span className="text-sm text-muted-foreground">.com</span>
              </InputGroup>
            </div>
          </div>

          {/* Input OTP */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Input OTP</h3>
            <div className={styles.spaceY4}>
              <label className="text-sm font-medium">Verification Code</label>
              <InputOTP
                value={inputOtpValue}
                onChange={setInputOtpValue}
                maxLength={6}
              >
                <InputOTPGroup className="justify-center">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          </div>

          {/* Radio Group */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Radio Group</h3>
            <RadioGroup
              value={radioGroupValue}
              onValueChange={setRadioGroupValue}
            >
              <div className={styles.flex}>
                <div className={styles.flex}>
                  <RadioGroupItem value="option1" id="option1" />
                  <label htmlFor="option1" className="ml-2 text-sm font-medium">
                    Option 1
                  </label>
                </div>
              </div>
              <div className={styles.flex}>
                <div className={styles.flex}>
                  <RadioGroupItem value="option2" id="option2" />
                  <label htmlFor="option2" className="ml-2 text-sm font-medium">
                    Option 2
                  </label>
                </div>
              </div>
              <div className={styles.flex}>
                <div className={styles.flex}>
                  <RadioGroupItem value="option3" id="option3" />
                  <label htmlFor="option3" className="ml-2 text-sm font-medium">
                    Option 3
                  </label>
                </div>
              </div>
            </RadioGroup>
          </div>
        </section>

        {/* Interaction Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Interaction</h2>
            <p className={styles.sectionDescription}>
              Interactive and layout components
            </p>
          </div>

          {/* Collapsible */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Collapsible</h3>
            <div className={styles.spaceY4}>
              <Collapsible
                open={collapsibleOpen}
                onOpenChange={setCollapsibleOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    {collapsibleOpen ? "Hide" : "Show"} Content
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className={styles.spaceY4}>
                  <div className={styles.p8}>
                    <p className="text-sm text-muted-foreground">
                      This content can be collapsed and expanded. It
                      demonstrates the collapsible primitive component.
                    </p>
                    <div className={styles.gridCols2}>
                      <Button size="sm">Action 1</Button>
                      <Button size="sm" variant="outline">
                        Action 2
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Resizable - Temporarily disabled */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Resizable Panels</h3>
            <div className="min-h-[200px] rounded-lg border p-8 text-center text-muted-foreground">
              Resizable panels component temporarily disabled
            </div>
          </div>

          {/* Scroll Area */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Scroll Area</h3>
            <div className={styles.border}>
              <ScrollArea className="h-[200px] w-full">
                <div className={styles.p8}>
                  <h4 className="font-medium mb-4">Scrollable Content</h4>
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} className={styles.p4}>
                      <p className="text-sm">
                        This is scrollable content item {i + 1}. The scroll area
                        provides a custom scrollbar that matches the design
                        system.
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Separator */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Separator</h3>
            <div className={styles.spaceY8}>
              <div>
                <h4 className="font-medium">Horizontal Separator</h4>
                <div className={styles.spaceY4}>
                  <p className="text-sm text-muted-foreground">
                    Content above separator
                  </p>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    Content below separator
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium">Vertical Separator</h4>
                <div className={styles.flex}>
                  <div className={styles.p4}>
                    <p className="text-sm">Left content</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className={styles.p4}>
                    <p className="text-sm">Right content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popover */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Popover</h3>
            <div className={styles.flex}>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className={styles.spaceY4}>
                    <h4 className="font-medium leading-none">Dimensions</h4>
                    <p className="text-sm text-muted-foreground">
                      Set the dimensions for the layer.
                    </p>
                  </div>
                  <div className={styles.gridCols2}>
                    <div className={styles.spaceY2}>
                      <label className="text-sm font-medium">Width</label>
                      <Input value="100%" readOnly />
                    </div>
                    <div className={styles.spaceY2}>
                      <label className="text-sm font-medium">Height</label>
                      <Input value="100%" readOnly />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Hover Card */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Hover Card</h3>
            <div className={styles.flex}>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="link">@nextjs</Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className={styles.flex}>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">@nextjs</h4>
                      <p className="text-sm">The React Framework for the Web</p>
                      <div className={styles.flex}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          {/* Context Menu */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Context Menu</h3>
            <div className={styles.flex}>
              <ContextMenu>
                <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
                  Right click here
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                  <ContextMenuItem inset>
                    Back
                    <span className="ml-auto text-xs">⌘[</span>
                  </ContextMenuItem>
                  <ContextMenuItem inset disabled>
                    Forward
                    <span className="ml-auto text-xs">⌘]</span>
                  </ContextMenuItem>
                  <ContextMenuItem inset>
                    Reload
                    <span className="ml-auto text-xs">⌘R</span>
                  </ContextMenuItem>
                  <ContextMenuItem inset>More Tools</ContextMenuItem>
                  <ContextMenuItem inset>Developer Tools</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dropdown Menu</h3>
            <div className={styles.flex}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    Profile
                    <span className="ml-auto text-xs">⇧⌘P</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Billing
                    <span className="ml-auto text-xs">⌘B</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Settings
                    <span className="ml-auto text-xs">⌘S</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Keyboard shortcuts
                    <span className="ml-auto text-xs">⌘K</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Subscription</DropdownMenuItem>
                  <DropdownMenuItem>
                    Sign out
                    <span className="ml-auto text-xs">⇧⌘Q</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </section>

        {/* Utilities Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Utilities</h2>
            <p className={styles.sectionDescription}>
              Utility components for content display
            </p>
          </div>

          {/* Empty */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Empty State</h3>
            <div className={styles.flex}>
              <Empty className="w-full max-w-sm">
                <EmptyContent>
                  <EmptyMedia variant="icon">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No files found</EmptyTitle>
                    <EmptyDescription>
                      Get started by uploading your first file or creating a new
                      document.
                    </EmptyDescription>
                  </EmptyHeader>
                </EmptyContent>
              </Empty>
            </div>
          </div>

          {/* Item */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Item</h3>
            <div className={styles.spaceY4}>
              <ItemGroup>
                <Item>
                  <ItemMedia variant="icon">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </ItemMedia>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle>Document.pdf</ItemTitle>
                      <ItemActions>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </ItemActions>
                    </ItemHeader>
                    <ItemDescription>
                      A sample PDF document for demonstration purposes.
                    </ItemDescription>
                  </ItemContent>
                </Item>
                <ItemSeparator />
                <Item>
                  <ItemMedia variant="icon">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </ItemMedia>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle>Image.jpg</ItemTitle>
                      <ItemActions>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </ItemActions>
                    </ItemHeader>
                    <ItemDescription>
                      A beautiful landscape photograph taken during sunset.
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </ItemGroup>
            </div>
          </div>

          {/* Kbd */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Keyboard Shortcuts</h3>
            <div className={styles.flex}>
              <div className={styles.spaceY4}>
                <div className={styles.flex}>
                  <span className="text-sm text-muted-foreground mr-2">
                    Save:
                  </span>
                  <KbdGroup>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>S</Kbd>
                  </KbdGroup>
                </div>
                <div className={styles.flex}>
                  <span className="text-sm text-muted-foreground mr-2">
                    Undo:
                  </span>
                  <KbdGroup>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Z</Kbd>
                  </KbdGroup>
                </div>
                <div className={styles.flex}>
                  <span className="text-sm text-muted-foreground mr-2">
                    Copy:
                  </span>
                  <KbdGroup>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>C</Kbd>
                  </KbdGroup>
                </div>
              </div>
            </div>
          </div>

          {/* Sonner Toaster */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Toast Notifications</h3>
            <div className={styles.flex}>
              <div className={styles.spaceY4}>
                <Button
                  onClick={() => {
                    // toast.success("Success message");
                    console.info("Toast would show here");
                  }}
                >
                  Show Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // toast.error("Error message");
                    console.info("Toast would show here");
                  }}
                >
                  Show Error Toast
                </Button>
                <p className="text-xs text-muted-foreground">
                  Note: Toast notifications require the Toaster component to be
                  mounted at the app level
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Assemblies Section */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeader}>Assemblies</h2>
            <p className={styles.sectionDescription}>App-specific flows</p>
          </div>

          {/* Properties Panel */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Properties Panel</h3>
            <div className={styles.border}>
              <div className={styles.p8}>
                <h4 className="font-medium">Canvas Properties</h4>
                <div className={styles.spaceY8}>
                  <div className={styles.spaceY4}>
                    <label className="text-sm font-medium">
                      Background Color
                    </label>
                    <Input value="#18181b" readOnly />
                  </div>
                  <div className={styles.spaceY4}>
                    <label className="text-sm font-medium">
                      Background Type
                    </label>
                    <div className={styles.flex}>
                      <Button size="sm" variant="outline">
                        Solid
                      </Button>
                      <Button size="sm" variant="outline">
                        Grid
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: Full PropertiesPanel component requires CanvasProvider
                    context
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Navigation */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Top Navigation</h3>
            <div className={styles.border}>
              <TopNavigation />
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          open={shortcutsModalOpen}
          onOpenChange={setShortcutsModalOpen}
        />
      </div>
    </div>
  );
}
