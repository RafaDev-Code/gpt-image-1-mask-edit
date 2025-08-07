'use client'

import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'

const colorTokens = [
  { name: 'background', var: '--dt-background' },
  { name: 'foreground', var: '--dt-foreground' },
  { name: 'card', var: '--dt-card' },
  { name: 'card-foreground', var: '--dt-card-foreground' },
  { name: 'muted', var: '--dt-muted' },
  { name: 'muted-foreground', var: '--dt-muted-foreground' },
  { name: 'primary', var: '--dt-primary' },
  { name: 'primary-foreground', var: '--dt-primary-foreground' },
  { name: 'secondary', var: '--dt-secondary' },
  { name: 'secondary-foreground', var: '--dt-secondary-foreground' },
  { name: 'accent', var: '--dt-accent' },
  { name: 'accent-foreground', var: '--dt-accent-foreground' },
  { name: 'border', var: '--dt-border' },
  { name: 'ring', var: '--dt-ring' },
]

const stateTokens = [
  { name: 'success', var: '--success', softVar: '--state-success-soft' },
  { name: 'warning', var: '--warning', softVar: '--state-warning-soft' },
  { name: 'error', var: '--error', softVar: '--state-error-soft' },
  { name: 'info', var: '--info', softVar: '--state-info-soft' },
]

function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <div 
        className="w-12 h-12 rounded border border-border" 
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div>
        <div className="font-mono text-sm">{name}</div>
        <div className="text-xs text-muted-foreground">{cssVar}</div>
      </div>
    </div>
  )
}

function StateSwatch({ name, cssVar, softVar }: { name: string; cssVar: string; softVar: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
        <div 
          className="w-12 h-12 rounded border border-border" 
          style={{ backgroundColor: `var(${cssVar})` }}
        />
        <div>
          <div className="font-mono text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">{cssVar}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
        <div 
          className="w-12 h-12 rounded border border-border" 
          style={{ backgroundColor: `var(${softVar})` }}
        />
        <div>
          <div className="font-mono text-sm">{name}-soft</div>
          <div className="text-xs text-muted-foreground">{softVar}</div>
        </div>
      </div>
    </div>
  )
}

export default function ThemePreviewPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Theme Preview</h1>
          <p className="text-muted-foreground mb-6">Preview all design tokens and components across different themes</p>
          <ThemeSwitcher />
        </div>

        {/* Color Tokens */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Base Color Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorTokens.map((token) => (
              <ColorSwatch key={token.name} name={token.name} cssVar={token.var} />
            ))}
          </div>
        </section>

        {/* State Tokens */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">State Color Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stateTokens.map((token) => (
              <StateSwatch 
                key={token.name} 
                name={token.name} 
                cssVar={token.var} 
                softVar={token.softVar} 
              />
            ))}
          </div>
        </section>

        {/* Component Examples */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Component Examples</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Different button variants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
              </CardContent>
            </Card>

            {/* Form Elements */}
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>Input fields and controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Text input" />
                <Textarea placeholder="Textarea" rows={3} />
                <div className="flex items-center space-x-2">
                  <Checkbox id="checkbox" />
                  <label htmlFor="checkbox" className="text-sm">Checkbox</label>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>Different alert states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-border bg-[var(--state-success-soft)]">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success-foreground">
                    Success alert message
                  </AlertDescription>
                </Alert>
                <Alert className="border-border bg-[var(--state-warning-soft)]">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning-foreground">
                    Warning alert message
                  </AlertDescription>
                </Alert>
                <Alert className="border-border bg-[var(--state-error-soft)]">
                  <AlertCircle className="h-4 w-4 text-error" />
                  <AlertDescription className="text-error-foreground">
                    Error alert message
                  </AlertDescription>
                </Alert>
                <Alert className="border-border bg-[var(--state-info-soft)]">
                  <Info className="h-4 w-4 text-info" />
                  <AlertDescription className="text-info-foreground">
                    Info alert message
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Different badge variants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Table Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Table Example</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4">Item 1</td>
                    <td className="p-4">
                      <Badge className="bg-[var(--state-success-soft)] text-success border-success">Active</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">$100</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/50">
                    <td className="p-4">Item 2</td>
                    <td className="p-4">
                      <Badge className="bg-[var(--state-warning-soft)] text-warning border-warning">Pending</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">$200</td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="p-4">Item 3</td>
                    <td className="p-4">
                      <Badge className="bg-[var(--state-error-soft)] text-error border-error">Error</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">$300</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        {/* Links */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Links</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p>
                  This is a paragraph with a{' '}
                  <a href="#" className="text-primary hover:text-primary/80 underline">
                    primary link
                  </a>{' '}
                  and another{' '}
                  <a href="#" className="text-accent hover:text-accent/80 underline">
                    accent link
                  </a>.
                </p>
                <p className="text-muted-foreground">
                  This is muted text with a{' '}
                  <a href="#" className="text-primary hover:text-primary/80 underline">
                    link
                  </a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}