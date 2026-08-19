import os

class canvas:
    count = 0
    size = "full-screen"
    def __init__(self, width=None, height=None, id='id', columns="1", ratio="1fr", bg="white"):
        self.id = f"canvas_{canvas.count}"
        
        # If width is "full-screen", or both width and height are omitted
        if width == "full-screen" or (width is None and height is None):
            self.width = "100vw"
            self.height = "100vh"
        else:
            self.width = width if width is not None else "100vw"
            self.height = height if height is not None else "100vh"
            
        self.columns = columns
        self.ratio = ratio
        self.bg = bg
        if canvas.count == 0:
            self.clear_files()
            
        canvas.count += 1
        self.render_html()
        self.render_css()

    def clear_files(self):
        import re
        html_path = os.path.join(os.path.dirname(__file__), "index.html")
        if os.path.exists(html_path):
            with open(html_path, "r") as f:
                html = f.read()
            html = re.sub(r"\s*<div id='canvas_\d+'[^>]*>.*?</div>\s*", "\n", html, flags=re.DOTALL)
            with open(html_path, "w") as f:
                f.write(html)

        css_path = os.path.join(os.path.dirname(__file__), "style.css")
        if os.path.exists(css_path):
            with open(css_path, "r") as f:
                css = f.read()
            # Clear canvas CSS rules
            css = re.sub(r"\s*#canvas_\d+\s*\{[^}]*\}\s*", "\n", css)
            # Clear node CSS rules
            css = re.sub(r"\s*#node_\d+\s*\{[^}]*\}\s*", "\n", css)
            with open(css_path, "w") as f:
                f.write(css)

    def render_html(self):
        canvas_div = f"<div id='{self.id}' class='canvas'>\n        <!--content into {self.id}-->\n    </div>"
        file_path = os.path.join(os.path.dirname(__file__), "index.html")
        with open(file_path, "r") as f:
            html = f.read()
        html = html.replace("<!--python canvas-->", f"{canvas_div}\n    <!--python canvas-->")
        with open(file_path, "w") as f:
            f.write(html)
        
    def render_css(self):
        canvas_colors = [
            "canvas-white",
            "canvas-off-white",
            "canvas-light-grey",
            "canvas-grey-medium",
            "canvas-grey-slate",
            "canvas-dark-grey",
            "canvas-black",
            "canvas-navy-dark",
            "canvas-navy-deep"
        ]
        width = f"{self.width}px" if isinstance(self.width, (int, float)) or (isinstance(self.width, str) and self.width.isdigit()) else self.width
        height = f"{self.height}px" if isinstance(self.height, (int, float)) or (isinstance(self.height, str) and self.height.isdigit()) else self.height
        style = (
            f"#{self.id} {{\n"
            f"    width: {width};\n"
            f"    height: {height};\n"
            f"    grid-template-columns: repeat({self.columns}, {self.ratio});\n"
            f"    background-color: {"var(--%s)" % self.bg if self.bg in canvas_colors else f"{self.bg}"};\n"
            f"}}"
        )

        file_path = os.path.join(os.path.dirname(__file__), "style.css")
        with open(file_path, "r") as f:
            css = f.read()
        css = css.replace("/* canvas user */" , f"{style} \n /* canvas user */")
        with open(file_path, "w") as f:
            f.write(css)    
        
    def node(self, content, id=None, connecitions=None, bg="var(--bg-brand-accent)"):
        return Node(content, self.id, id, connecitions, bg)

class Node:
    id = 0
    def __init__(self, content, canvas_id, id=None, connecitions=None, bg="var(--bg-brand-accent)"):
        if connecitions is None:
            connecitions = []
        if id is None:
            id = f"node_{Node.id}"
            Node.id += 1
        self.canvas_id = canvas_id
        self.id = id
        self.content = content
        self.connecitions = connecitions
        self.bg = bg
        self.render_html()
        self.render_css()
    
    def render_html(self):
        node_div = f"<div id='{self.id}' class='node'>{self.content}</div>"
        file_path = os.path.join(os.path.dirname(__file__), "index.html")
        with open(file_path, "r") as f:
            html = f.read()
        html = html.replace(f"<!--content into {self.canvas_id}-->", f"{node_div}\n        <!--content into {self.canvas_id}-->")
        with open(file_path, "w") as f:
            f.write(html)
    
    def render_css(self):
        file_path = os.path.join(os.path.dirname(__file__), "style.css")
        with open(file_path, "r") as f:
            css = f.read()
        style = f"#{self.id} {{\n    background-color: {self.bg};\n}}"
        css = css.replace("/* canvas user */", f"{style}\n\n/* canvas user */")
        with open(file_path, "w") as f:
            f.write(css)
        
        
            

        

        