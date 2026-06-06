import {
  collapseVerticalCharacterRuns,
  latexToReadable,
  sanitizeWikipediaPlaintext,
} from "../src/features/content/wikipedia-plaintext";

const ZIPPING_EXAMPLE_SNIPPET = `Given the three words cat, fish and be where |cat| is 3, |fish| is 4 and |be| is 2. Let 
  
    
      
        ℓ
      
    
    {\\displaystyle \\ell }
  
 denote the length of the longest word which is fish; 
  
    
      
        ℓ
        =
        4
      
    
    {\\displaystyle \\ell =4}
  
. The zip of cat, fish, be is then 4 tuples of elements:

  
    
      
        (
        c
        ,
        f
        ,
        b
        )
        (
        a
        ,
        i
        ,
        e
        )
        (
        t
        ,
        s
        ,
        #
        )
        (
        #
        ,
        h
        ,
        #
        )
      
    
    {\\displaystyle (c,f,b)(a,i,e)(t,s,\\#)(\\#,h,\\#)}
  

where # is a symbol not in the original alphabet.`;

describe("latexToReadable", () => {
  it("converts common LaTeX symbols and subscripts", () => {
    expect(latexToReadable("\\ell")).toBe("ℓ");
    expect(latexToReadable("\\ell =4")).toBe("ℓ =4");
    expect(latexToReadable("(x_{1},y_{1},\\ldots )")).toBe("(x₁,y₁,… )");
    expect(latexToReadable("{\\underline {\\ell }}=2")).toBe("ℓ =2");
    expect(latexToReadable("((\\Sigma \\cup \\{\\#\\})^{n})^{*}")).toContain("Σ");
    expect(latexToReadable("((\\Sigma \\cup \\{\\#\\})^{n})^{*}")).toContain("#");
  });
});

describe("collapseVerticalCharacterRuns", () => {
  it("joins single-character lines into one inline fragment", () => {
    expect(
      collapseVerticalCharacterRuns(
        "(\nc\n,\nf\n,\nb\n)\n(\na\n,\ni\n,\ne\n)",
      ),
    ).toBe("(c,f,b)(a,i,e)");
  });
});

const ZIPPING_DEFINITION_SNIPPET = `== Definition ==
Let Σ be an alphabet, # a symbol not in Σ.
Let x1x2... x|x|, y1y2... y|y|, z1z2... z|z|, ... be n words (i.e. finite sequences) of elements of Σ. Let 
  
    
      
        ℓ
      
    
    {\\displaystyle \\ell }
  
 denote the length of the longest word, i.e. the maximum of |x|, |y|, |z|, ... .
The zip of these words is a finite sequence of n-tuples of elements of (Σ ∪ {#}), i.e. an element of 
  
    
      
        (
        (
        Σ
        ∪
        {
        #
        }
        
          )
          
            n
          
        
        
          )
          
            ∗
          
        
      
    
    {\\displaystyle ((\\Sigma \\cup \\{\\#\\})^{n})^{*}}
  
:

  
    
      
        (
        
          x
          
            1
          
        
        ,
        
          y
          
            1
          
        
        ,
        …
        )
        (
        
          x
          
            2
          
        
        ,
        
          y
          
            2
          
        
        ,
        …
        )
        …
        (
        
          x
          
            ℓ
          
        
        ,
        
          y
          
            ℓ
          
        
        ,
        …
        )
      
    
    {\\displaystyle (x_{1},y_{1},\\ldots )(x_{2},y_{2},\\ldots )\\ldots (x_{\\ell },y_{\\ell },\\ldots )}
  

where for any index i > |w|, the wi is #. The zip of x, y, z, ... is denoted zip(x, y, z, ...) or x * y * z * ... The inverse to zip is sometimes denoted unzip. A variation of the zip operation is defined by:

  
    
      
        (
        
          x
          
            1
          
        
        ,
        
          y
          
            1
          
        
        ,
        …
        )
        …
        (
        
          x
          
            ℓ
          
        
        ,
        
          y
          
            ℓ
          
        
        ,
        …
        )
      
    
    {\\displaystyle (x_{1},y_{1},\\ldots )\\ldots (x_{\\ell },y_{\\ell },\\ldots )}
  

where 
  
    
      
        ℓ
      
    
    {\\displaystyle \\ell }
  
 is the minimum length of the input sequences, and 
  
    
      
        #
      
    
    {\\displaystyle \\#}
  
, but destroys information about elements of the input sequences beyond`;

describe("sanitizeWikipediaPlaintext", () => {
  it("cleans math fallback debris from a STEM article excerpt", () => {
    const cleaned = sanitizeWikipediaPlaintext(ZIPPING_EXAMPLE_SNIPPET);

    expect(cleaned).not.toContain("{\\displaystyle");
    expect(cleaned).toContain("(c,f,b)(a,i,e)(t,s,#)(#,h,#)");
    expect(cleaned).toContain("ℓ =4");
    expect(cleaned).not.toMatch(/^\s*\(\s*$/m);
    expect(cleaned).not.toMatch(/^\s*,\s*\.\.\./m);
  });

  it("removes dangling parentheses from the Definition section of a STEM article", () => {
    const cleaned = sanitizeWikipediaPlaintext(ZIPPING_DEFINITION_SNIPPET);

    expect(cleaned).not.toContain("{\\displaystyle");
    expect(cleaned).not.toMatch(/^\s*,\s*\.\.\./m);
    expect(cleaned).not.toMatch(/^\s*\*\s*$/m);
    expect(cleaned).toContain("((Σ ∪ #)ⁿ)∗");
    expect(cleaned).toContain("(x₁,y₁,… )");
    expect(cleaned).toContain(
      "but destroys information about elements of the input sequences beyond",
    );
    expect(cleaned).not.toMatch(/^,\s+but destroys/m);
  });
});
