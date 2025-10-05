Designing a Floating Properties Panel for a Design Editor and Motion Graphics Platform

1\. Background research and reference inspirations

1.1 Key insights from modern design tool UX patterns

Modern design tools have evolved their interfaces to optimize canvas space and improve control accessibility. Key patterns include **resizable and collapsible panels** that reorganize navigation with file information on the left and properties on the right. The **toolbar placement** has moved to maximize working space, with properties panels that automatically reopen when objects are selected. **Properties panels** are designed to be user‑friendly through workflow-based grouping and resizable layouts to accommodate descriptive control names. **Property labels** can be toggled for clarity, and layout controls are organized into logical sections like "Layout" for dimensions and "Position" for constraints. Improved asset browsing, contextual action menus, and mode switching round out these interface improvements. These changes collectively reduce UI clutter and surface important controls while hiding advanced options behind collapsible sections.

Research on design tool interfaces emphasizes **customized experiences based on user roles and tasks**. Developer modes hide editing tools and show code‑focused panels when toggled, allowing different user types to see only relevant controls. When presenting, panels can be hidden to focus attention on content. Studies show that **prioritizing commonly used properties** at the top of panels and providing **global search** for actions and assets improves discoverability. Understanding user interaction patterns helps determine which controls deserve prominence in the interface.

1.2 Principles of progressive disclosure

**Progressive disclosure** is a UX strategy that shows only the most important information initially, revealing more advanced options when needed[\[7\]](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1#:~:text=Progressive%20disclosure%20is%20the%20answer,users%20focused%20and%20experiences%20clean). This approach reduces cognitive load, keeps novices focused and allows power users to access advanced features without clutter[\[8\]](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1#:~:text=Why%20It%20Works%20,UX). General guidelines include: design for the 80 % of frequent tasks and hide controls used by the remaining 20 %; use clear affordances (icons, arrows, toggles) to indicate expandable sections; and reveal options only when they add value[\[9\]](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1#:~:text=Design%20Guidelines). Jakob Nielsen’s research emphasises that progressive disclosure should split features so that frequently used options are always visible, while rarer settings reside behind a “more” link or advanced section[\[10\]](https://www.nngroup.com/articles/progressive-disclosure/#:~:text=Summary:%C2%A0%20Progressive%20disclosure%20defers%20advanced,prone). Designers must determine the correct split through task analysis and usage data; the path to reveal advanced settings must be obvious and clearly labelled[\[11\]](https://www.nngroup.com/articles/progressive-disclosure/#:~:text=designing%20for%20progressive%20disclosure:). Progressive disclosure improves learnability and efficiency by preventing users from scanning large lists of options[\[12\]](https://www.nngroup.com/articles/progressive-disclosure/#:~:text=In%20a%20system%20designed%20with,tells%20users%20that%20it's%20important).

UXmatters adds that designers must **make conscious decisions about what information must remain visible and what can be a click away**[\[13\]](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php#:~:text=,This%20is%20designing%20progressive%20disclosure). Drawers anchored to a UI element are recommended over floating pop‑ups for revealing additional controls, because drawers are contextual and easier to connect with the element that triggered them[\[14\]](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php#:~:text=,interface%20element%E2%80%A6). Pop‑ups should be avoided for drilling down because they obscure context and are often dismissed[\[15\]](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php#:~:text=I%20still%20don%E2%80%99t%20get%20why,a%20couple%20of%20years%20ago).

1.3 Implications for design and motion tools

The research suggests that a **floating properties panel** can improve usability if it:

*   Emphasises **primary controls** (position, size, color, typography) immediately, while advanced settings (constraints, corner‑by‑corner radii, blend modes, keyframe easing) are hidden until users request them.
    
*   **Groups controls by category** (Layout, Appearance, Typography, Effects) and allows collapsing/expanding entire groups[\[16\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Enhanced%20Properties%20Panel).
    
*   Provides **clear affordances**—icons, chevrons, “More” buttons or horizontal dividers—to show where additional settings can be revealed[\[9\]](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1#:~:text=Design%20Guidelines).
    
*   Permits users to **resize the panel or detach sections** when more space is needed[\[3\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Enhanced%20Properties%20Panel).
    
*   Supports **mode switching** (Design vs. Animation) to show motion‑specific controls only when users toggle into animation mode.
    

2\. Bill of materials for a properties panel

The table below lists the major UI components and behaviours (“bill of materials”) required for the properties panel of both a **design editor** and a **motion graphics platform**. Controls marked as **shared** appear in both applications, while **animation‑specific** controls are only needed in the motion tool. The “Visual affordances & progressive disclosure” column describes interactive patterns that go beyond simple labels and inputs to support intuitive control.

**Note:** Do **not** place full sentences in table cells; use keywords/phrases only.

Property category

Example controls

Shared vs. animation

Visual affordances & progressive disclosure

**Position & size**

X/Y positions, width/height, rotation; constrain proportions

Shared

Numeric inputs with stepper arrows; link‑icon to lock aspect ratio (toggled to unlink); shift‑drag to adjust values; collapsible “Advanced geometry” section for rotation/origin

**Layout & alignment**

Alignment (left/center/right, top/middle/bottom); distribution; spacing; auto layout & direction; constraints

Shared

Grid of alignment icons; auto‑layout switch reveals directional buttons & spacing sliders; constraint pins (four‑way diagram) that highlight pinned edges; collapsible “Constraints” section with advanced pin/responsive rules [\[5\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Layout%20and%20Position%20Enhancements)

**Spacing & padding**

Margin, padding, gap between children (for layout containers); stack spacing

Shared

Linked numeric fields for symmetric spacing; unlink icon to set per‑side values; range slider for quick spacing tweaks; “More…” toggle reveals independent per‑item gap controls

**Appearance: Fill & stroke**

Solid/gradient fill, opacity, blend mode; stroke color, width, dash pattern; corner radius

Shared

Color swatch button opens colour picker; gradient preview bar; numeric opacity field with scrubber; dropdown for blend modes; separate chip to show whether colour is linked to a design token (e.g., coloured dot or token name tag)

**Corner radius**

Uniform radius; independent corners (top‑left, top‑right, bottom‑right, bottom‑left)

Shared

Single radius input with linked/unlinked toggle; when unlinked, four small inputs appear; preview graphic highlighting the corner being edited; advanced section for smoothing & shape rounding

**Typography**

Font family, weight, size, line height, letter spacing, paragraph alignment, text transformations

Shared

Dropdown for fonts showing previews; number inputs with stepper; alignment icons; show only common typography controls initially; “Show more typography” link reveals OpenType features, small caps, ligatures; tokens indicator if style ties to a typography token

**Color tokens & styles**

Link/unlink to design tokens; theme variables; style overrides

Shared

Small coloured dot or token pill next to controls; clicking reveals token name & description; drop‑down to change token; tooltip indicates overrides; advanced panel lists all component‑level tokens

**Effects**

Shadows (drop/inner), blur, blending, masks

Shared

List of effect chips with checkboxes; clicking a chip expands sub‑controls (e.g., X/Y offset, blur radius); plus button adds new effect; advanced link opens full effect browser; collapsed by default

**Transform & 3D**

Scale, rotate, flip, perspective; 3D rotation (for animations)

Shared in design; advanced in animation

Show simplified transform controls (flip and rotate) initially; “3D transform” toggle reveals additional sliders (X‑axis, Y‑axis rotation, perspective); interactive 3D gizmo for orientation

**Interactions & prototyping**

On‑click, on‑hover, action triggers, transitions

Shared (if the design tool supports prototyping)

Row of common triggers with icons (tap, drag, hover); selecting a trigger opens a mini‑modal to choose destination screen and transition type; “More interactions” reveals advanced triggers like variables and conditions

**Animation timeline & keyframes**

Timeline scrubber, keyframe insertion, motion paths, easing curves

Animation‑specific

Timeline view pinned at bottom of panel (collapsible); property rows appear when animated; clicking a property adds a keyframe; easing drop‑down with curve presets; drag handles on the curve; plus button to add new channels; “Show timeline” toggle reveals this entire section only in animation mode

**Storyboard & scenes**

Sequence of scenes/slides, durations, transitions

Animation‑specific

Vertical list of scenes with thumbnails; drag to reorder; plus icon to add scenes; timeline durations editable inline; collapsible to preserve space

**Effects & compositing for motion**

Filters, glow, motion blur, track mattes, blending

Animation‑specific

Stacked effect chips similar to design effects; each expands for parameter controls; collapse/expand for progressive disclosure; ability to reorder effects affects stacking

**Keyframe & motion properties**

Position, scale, rotation, opacity over time; path editing

Animation‑specific

Each animatable property row has a stopwatch icon to enable/disable animation; values editable inline; path editing opens overlay with bezier handles; advanced easing graph accessible via small graph icon

**Audio controls (optional)**

Attach sound to timeline, fade in/out

Animation‑specific

Audio strip with waveform preview; volume slider; fade handles; hidden by default until audio is added

**Live preview/inspect**

Real‑time preview of selected element’s style (CSS, tokens)

Shared

Code/inspect toggle to show CSS or style values; appears in developer mode; copy to clipboard button

**History / version controls**

Undo, redo, snapshots

Shared

Buttons integrated into top of panel or global UI; advanced history list accessible via expandable drawer

**Search & global actions**

Search actions, assets, tokens

Shared

Global search bar at top or via shortcut; results categorised (components, actions, tokens); accessible across modes

3\. Shared vs. animation‑specific properties

Many controls appear in both tools, but their complexity varies:

*   **Shared controls**: Position and sizing, layout alignment, spacing, fill/stroke, corner radii, typography, design tokens, basic effects and transforms, prototyping triggers, history and search. These are core to any design tool and should remain visible or easily accessible. Modern design tools place frequently used properties at the top of the panel. These shared controls can be represented with simple inputs, sliders or icon buttons. Progressive disclosure applies by collapsing advanced options (e.g., per‑corner radius or advanced layout constraints).
    
*   **Animation‑specific controls**: When the user toggles into animation mode, additional panels for timeline, keyframes and motion effects become available. Motion‑graphics tools separate timelines from property panels so that users can focus on animation without cluttering design tasks. In our floating panel, motion controls should be hidden by default and be revealed via a **mode switch** or a **"Show timeline"** toggle; this mirrors persona-based modes that hide editing tools from non-editors. Animation controls include keyframe timelines, easing curves, scene/storyboard management, motion paths, track mattes and audio; each of these may use advanced widgets (scrubbers, graphs) and therefore should reside in collapsible sections or drawers.
    

4\. Progressive disclosure strategy for the floating panel

1.  **Hierarchical grouping** – Organise properties into collapsible groups (Layout, Appearance, Typography, Effects, Animation). The most frequently used group (e.g., Layout) should be expanded by default, whereas others remain collapsed. This mirrors modern design tool panels where controls are grouped according to workflow patterns.
    
2.  **Show primary fields by default** – Within each group, show the most common controls (e.g., width/height, fill colour). Provide a “More options” link or chevron to reveal advanced settings such as blend modes or per‑corner radius. Research emphasises designing for the 80 % use case[\[9\]](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1#:~:text=Design%20Guidelines), so hide seldom‑used options until requested.
    
3.  **Context‑driven disclosure** – When certain attributes are irrelevant (e.g., stroke width for shapes with no stroke), hide or disable them. If multiple objects are selected with differing properties, show mixed‑state indicators and allow editing of shared properties only.
    
4.  **Clear affordances** – Use icons, toggle switches and labelled buttons to indicate when more controls are available. For example, the constraints panel can depict the bounding box with clickable pins; clicking reveals advanced responsive rules. Colour tokens can have pill‑shaped tags signifying link status. According to progressive‑disclosure guidelines, the mechanics for progressing to secondary levels must be obvious[\[17\]](https://www.nngroup.com/articles/progressive-disclosure/#:~:text=,For%20a%20website,%20follow).
    
5.  **Mode switching** – Provide a **Design/Animation toggle** to switch the entire panel's context. In design mode, hide timelines and keyframe editors; in animation mode, reveal them. This concept follows persona‑based modes where switching contexts alters the visible controls. Use an explicit label (e.g., "Animation") and ensure the switch is reversible.
    
6.  **Drawers instead of pop‑ups** – When expanding advanced sections, slide a drawer from the panel’s edge rather than showing a floating pop‑up; drawers keep context and maintain a clear anchor to the triggering element[\[14\]](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php#:~:text=,interface%20element%E2%80%A6). Only use pop‑overs for lightweight pickers (colour pickers, date/time for animation durations), and keep them anchored to the field they modify.
    
7.  **Responsive sizing** – Allow the floating panel to be resized or docked to screen edges to accommodate detailed editing. Modern design tools provide resizable panels; the same flexibility helps users manage space when editing long lists of tokens or keyframes.
    

5\. Visual affordances for specific controls

Below are examples of visual affordances that can make the panel more intuitive beyond simple text fields:

*   **Alignment controls** – Use a 3×3 grid of buttons representing left/middle/right and top/center/bottom alignment. When inside auto layout, highlight the current alignment and disable impossible options. Provide a secondary row for distribution (horizontal/vertical spacing) that appears when multiple items are selected.
    
*   **Color picker** – Show a circular swatch that opens a pop‑over with a hue wheel, saturation/value square, and numeric input. Include an eyedropper icon for sampling and a token pill showing the linked design token. Provide quick preset swatches beneath the picker. If the user selects a gradient fill, switch to a gradient editor with draggable stops.
    
*   **Constraints/aspect ratio** – Display a square bounding box icon with handles on each side; clicking a handle pins the element to that side. Show chain‑link icons between width and height fields to lock aspect ratio. An “Advanced constraints” drawer can include relative percentage constraints and scaling behaviour. Use tooltips to explain each constraint.
    
*   **Corner radius** – Provide a combined radius input with a link toggle; unlinked reveals four small fields arranged like the corners of a square. When editing a corner value, highlight the corresponding corner on the preview shape. Offer a handle on the canvas to adjust radius by dragging.
    
*   **Timeline & keyframes** – Use a horizontal scrubber with playhead and tick marks; each animatable property appears as a row when animation is enabled. Keyframes are represented as diamonds; clicking on a property’s stopwatch toggles animation. An easing drop‑down on each keyframe opens a curve editor. Provide drag handles for durations and multi‑select editing.
    
*   **Storyboard scenes** – Represent scenes as cards with thumbnails and durations; drag to reorder; clicking a card reveals properties like transitions and audio. Scenes are collapsed by default and expand when the user enters storyboard mode.
    
*   **Easing & curves** – Provide a mini preview of the easing curve (e.g., linear, ease‑in, ease‑out, custom). Clicking opens a graph editor with Bézier handles. Offer preset easing options as buttons for quick selection.
    
*   **Effects** – Show a list of effect chips (e.g., Shadow, Blur, Glow). Each chip expands into a mini panel when clicked. For example, a “Shadow” effect reveals X/Y offset inputs, blur slider and opacity slider. Reordering chips changes the stacking order, with drag handles on the left.
    
*   **Tokens** – Use coloured indicators (small circles) or labels to show when a property value is linked to a design token. Clicking the indicator opens a token selector that lists available tokens and their descriptions. Provide a clear “unlink” button to override a token value, and visual feedback (e.g., broken link icon) when a property deviates from a token.
    

6\. Recommendations for integrating design systems and tokens

1.  **Token indicator** – Place a small coloured circle or pill next to any property tied to a design token (colour, typography, spacing). The indicator should display the token name on hover and open a token selector on click.
    
2.  **Token browser** – Create a dedicated panel within the properties panel or a separate drawer that lists all design tokens organised by category (colour, typography, spacing, elevation). Allow users to search and filter tokens; select a token to apply it to the current property.
    
3.  **Overrides and composition** – When a property linked to a composite token (e.g., a typography style) is overridden, show which sub‑tokens have been modified. Provide a “Reset to token” option. Progressive disclosure applies here: default view shows the composite token; expanding reveals individual properties (font size, weight, line height) that can be overridden.
    
4.  **Visual feedback** – Indicate whether a property value matches the current theme (e.g., primary colour) or deviates. Use consistent icons (link, broken link) and tooltips to communicate the state.
    
5.  **History & versioning** – Record changes to tokens or overrides in the history log. Provide quick access to revert to previous token assignments.
    

7\. Conclusion

Designing a floating properties panel for a design editor and motion graphics platform involves balancing **simplicity** and **power**. Research into modern design tool interfaces shows that grouping controls, enabling panel resizing, and allowing users to turn on descriptive labels improve usability. Progressive disclosure should drive the panel's structure: show the most common controls upfront, hide advanced settings behind clear affordances, and use contextual drawers for in‑depth editing. A **mode switch** differentiates design tasks from animation tasks, revealing timelines and keyframe editors only when necessary. Lastly, integrating design tokens requires visible indicators and intuitive selectors so designers understand when properties are linked to system variables.

By following these principles and the bill of materials outlined above, both the design editor and motion graphics platform can share a coherent properties panel while accommodating the advanced needs of animators. Such a panel will provide an intuitive entry point for novices, scalable depth for experts, and clear visual language that communicates connection to design systems.

[\[1\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Resizable%20and%20Collapsible%20Panels) [\[2\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Minimized%20UI) [\[3\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Enhanced%20Properties%20Panel) [\[4\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Property%20Labels) [\[5\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Layout%20and%20Position%20Enhancements) [\[6\]](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow#:~:text=Searching,%20browsing,%20and%20inserting%20components,efficiency%20of%20the%20design%20process) Modern Design Tool Interface Patterns

[https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow](https://www.designmonks.co/blog/figma-ui-changes-to-enhance-your-design-workflow)

[\[7\]](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1#:~:text=Progressive%20disclosure%20is%20the%20answer,users%20focused%20and%20experiences%20clean) [\[8\]](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1#:~:text=Why%20It%20Works%20,UX) [\[9\]](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1#:~:text=Design%20Guidelines)  Progressive Disclosure: The Secret UX Pattern Behind Seamless Interfaces | by Victor Onyedikachi | Medium

[https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1](https://medium.com/@vioscott/progressive-disclosure-the-secret-ux-pattern-behind-seamless-interfaces-2d457f599df1)

[\[10\]](https://www.nngroup.com/articles/progressive-disclosure/#:~:text=Summary:%C2%A0%20Progressive%20disclosure%20defers%20advanced,prone) [\[11\]](https://www.nngroup.com/articles/progressive-disclosure/#:~:text=designing%20for%20progressive%20disclosure:) [\[12\]](https://www.nngroup.com/articles/progressive-disclosure/#:~:text=In%20a%20system%20designed%20with,tells%20users%20that%20it's%20important) [\[17\]](https://www.nngroup.com/articles/progressive-disclosure/#:~:text=,For%20a%20website,%20follow) Progressive Disclosure - NN/G

[https://www.nngroup.com/articles/progressive-disclosure/](https://www.nngroup.com/articles/progressive-disclosure/)

[\[13\]](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php#:~:text=,This%20is%20designing%20progressive%20disclosure) [\[14\]](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php#:~:text=,interface%20element%E2%80%A6) [\[15\]](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php#:~:text=I%20still%20don%E2%80%99t%20get%20why,a%20couple%20of%20years%20ago) Designing for Progressive Disclosure :: UXmatters

[https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php](https://www.uxmatters.com/mt/archives/2020/05/designing-for-progressive-disclosure.php)