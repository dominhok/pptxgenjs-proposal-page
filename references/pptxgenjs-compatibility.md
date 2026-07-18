# PptxGenJS compatibility normalization

PptxGenJS 4.0.1 creates an unused notes master for a presentation with no speaker notes. The notes-master element is placed in an order that fails strict Office Open XML schema validation and can trigger a repair warning in desktop PowerPoint.

The bundled `repair-pptxgenjs-ooxml.mjs` applies one narrowly scoped normalization immediately after generation:

- remove `ppt/notesMasters/*` and `ppt/notesSlides/*`;
- remove their content-type declarations;
- remove only notes-master and notes-slide relationships;
- remove `p:notesMasterIdLst` from `ppt/presentation.xml`.

It must not modify slide XML, shape geometry, text, themes, media, layouts, masters, or ordinary presentation relationships. Run OfficeCLI validation afterward. If validation still reports an OOXML error, stop and fix the generator or template rather than broadening this repair script.

Upstream context: <https://github.com/gitbrent/pptxgenjs/issues/1449>
