---
title: ASCII
---
ASCII ( ), an acronym for American Standard Code for Information Interchange, is a character encoding standard for electronic communication. ASCII codes represent text in computers, telecommunications equipment, and other devices. ASCII has just 128 code points, of which only 95 are , which severely limit its scope. The set of available punctuation had significant impact on the syntax of computer languages and text markup. ASCII hugely influenced the design of character sets used by modern computers, including Unicode which has over a million code points, but the first 128 of these are the same as ASCII.

The Internet Assigned Numbers Authority (IANA) prefers the name US-ASCII for this character encoding.

ASCII is one of the IEEE milestones.

Overview
ASCII was developed in part from telegraph code. Its first commercial use was in the Teletype Model 33 and the Teletype Model 35 as a seven-bit teleprinter code promoted by Bell data services. Work on the ASCII standard began in May 1961, with the first meeting of the American Standards Association's (ASA) (now the American National Standards Institute or ANSI) X3.2 subcommittee. The first edition of the standard was published in 1963, underwent a major revision during 1967, and experienced its most recent update during 1986. Compared to earlier telegraph codes, the proposed Bell code and ASCII were both ordered for more convenient sorting (i.e., alphabetization) of lists and added features for devices other than teleprinters.

The use of ASCII format for Network Interchange was described in 1969. (NB. Almost identical wording to USAS X3.4-1968 except for the intro.) That document was formally elevated to an Internet Standard in 2015.

Originally based on the (modern) English alphabet, ASCII encodes 128 specified characters into seven-bit integers as shown by the ASCII chart in this article. Ninety-five of the encoded characters are printable: these include the digits 0 to 9, lowercase letters a to z, uppercase letters A to Z, and punctuation symbols. In addition, the original ASCII specification included 33 non-printing control codes which originated with s; most of these are now obsolete, although a few are still commonly used, such as the carriage return, line feed, and tab codes.

For example, lowercase i would be represented in the ASCII encoding by binary 1101001 = hexadecimal 69 (i is the ninth letter) = decimal 105.

Despite being an American standard, ASCII does not have a code point for the cent (¢). It also does not support English terms with diacritical marks such as résumé and jalapeño, or proper nouns with diacritical marks such as Beyoncé (although on certain devices characters could be combined with punctuation such as Tilde (~) and Backtick (`) to approximate such characters.)

History
thumb|upright=1.25|right|ASCII (1963). Control Pictures of equivalent controls are shown where they exist, or a grey dot otherwise.
The American Standard Code for Information Interchange (ASCII) was developed under the auspices of a committee of the American Standards Association (ASA), called the X3 committee, by its X3.2 (later X3L2) subcommittee, and later by that subcommittee's X3.2.4 working group (now INCITS). The ASA later became the United States of America Standards Institute (USASI) and ultimately became the American National Standards Institute (ANSI).

With the other special characters and control codes filled in, ASCII was published as ASA X3.4-1963, leaving 28 code positions without any assigned meaning, reserved for future standardization, and one unassigned control code. There was some debate at the time whether there should be more control characters rather than the lowercase alphabet. The indecision did not last long: during May 1963 the CCITT Working Party on the New Telegraph Alphabet proposed to assign lowercase characters to sticks 6 and 7,Brief Report: Meeting of CCITT Working Party on the New Telegraph Alphabet, May 13–15, 1963. and International Organization for Standardization TC 97 SC 2 voted during October to incorporate the change into its draft standard.Report of ISO/TC/97/SC 2 – Meeting of October 29–31, 1963. The X3.2.4 task group voted its approval for the change to ASCII at its May 1963 meeting.Report on Task Group X3.2.4, June 11, 1963, Pentagon Building, Washington, DC. Locating the lowercase letters in sticks 6 and 7 caused the characters to differ in bit pattern from the upper case by a single bit, which simplified case-insensitive character matching and the construction of keyboards and printers.

The X3 committee made other changes, including other new characters (the brace and vertical bar characters),Report of Meeting No. 8, Task Group X3.2.4, December 17 and 18, 1963 renaming some control characters (SOM became start of header (SOH)) and moving or removing others (RU was removed). ASCII was subsequently updated as USAS X3.4-1967, then USAS X3.4-1968, ANSI X3.4-1977, and finally, ANSI X3.4-1986.

Revisions

 ASA X3.4-1963
 ASA X3.4-1965 (approved, but not published, nevertheless used by IBM 2260 & 2265 Display Stations and IBM 2848 Display Control)
 USAS X3.4-1967
 USAS X3.4-1968
 ANSI X3.4-1977
 ANSI X3.4-1986
 ANSI X3.4-1986 (R1992)
 ANSI X3.4-1986 (R1997)
 ANSI INCITS 4-1986 (R2002)
 ANSI INCITS 4-1986 (R2007)
 INCITS 4-1986 (R2012)
 INCITS 4-1986 (R2017)
 INCITS 4-1986 (R2022)

In the X3.15 standard, the X3 committee also addressed how ASCII should be transmitted (least significant bit first) and recorded on perforated tape. They proposed a 9-track standard for magnetic tape and attempted to deal with some punched card formats.

Design considerations

Bit width
The X3.2 subcommittee designed ASCII based on the earlier teleprinter encoding systems. Like other character encodings, ASCII specifies a correspondence between digital bit patterns and character symbols (i.e. graphemes and control characters). This allows digital devices to communicate with each other and to process, store, and communicate character-oriented information such as written language. Before ASCII was developed, the encodings in use included 26 alphabetic characters, 10 numerical digits, and from 11 to 25 special graphic symbols. To include all these, and control characters compatible with the Comité Consultatif International Téléphonique et Télégraphique (CCITT) International Telegraph Alphabet No. 2 (ITA2) standard of 1932, FIELDATA (1956), and early EBCDIC (1963), more than 64 codes were required for ASCII.

ITA2 was in turn based on Baudot code, the 5-bit telegraph code Émile Baudot invented in 1870 and patented in 1874.

The committee debated the possibility of a shift function (like in ITA2), which would allow more than 64 codes to be represented by a six-bit code. In a shifted code, some character codes determine choices between options for the following character codes. It allows compact encoding, but is less reliable for data transmission, as an error in transmitting the shift code typically makes a long part of the transmission unreadable. The standards committee decided against shifting, and so ASCII required at least a seven-bit code.

The committee considered an eight-bit code, since eight bits (octets) would allow two four-bit patterns to efficiently encode two digits with binary-coded decimal. However, it would require all data transmission to send eight bits when seven could suffice. The committee voted to use a seven-bit code to minimize costs associated with data transmission. Since perforated tape at the time could record eight bits in one position, it also allowed for a parity bit for error checking if desired. Eight-bit machines (with octets as the native data type) that did not use parity checking typically set the eighth bit to 0.

Internal organization
The code itself was patterned so that most control codes were together and all graphic codes were together, for ease of identification. The first two so-called ASCII sticks (32 positions) were reserved for control characters. The "space" character had to come before graphics to make sorting easier, so it became position 20hex; for the same reason, many special signs commonly used as separators were placed before digits. The committee decided it was important to support uppercase 64-character alphabets, and chose to pattern ASCII so it could be reduced easily to a usable 64-character set of graphic codes, as was done in the DEC SIXBIT code (1963). Lowercase letters were therefore not interleaved with uppercase. To keep options available for lowercase letters and other graphics, the special and numeric codes were arranged before the letters, and the letter A was placed in position 41hex to match the draft of the corresponding British standard. The digits 0–9 are prefixed with 011, but the remaining 4 bits correspond to their respective values in binary, making conversion with binary-coded decimal straightforward (for example, 5 in encoded to 0110101, where 5 is 0101 in binary).

Many of the non-alphanumeric characters were positioned to correspond to their shifted position on typewriters; an important subtlety is that these were based on mechanical typewriters, not electric typewriters. Mechanical typewriters followed the de facto standard set by the Remington No. 2 (1878), the first typewriter with a shift key, and the shifted values of 23456789- were "#$%_&'() early typewriters omitted 0 and 1, using O (capital letter o) and l (lowercase letter L) instead, but 1! and 0) pairs became standard once 0 and 1 became common. Thus, in ASCII !"#$% were placed in the second stick, positions 1–5, corresponding to the digits 1–5 in the adjacent stick. The parentheses could not correspond to 9 and 0, however, because the place corresponding to 0 was taken by the space character. This was accommodated by removing _ (underscore) from 6 and shifting the remaining characters, which corresponded to many European typewriters that placed the parentheses with 8 and 9. This discrepancy from typewriters led to bit-paired keyboards, notably the Teletype Model 33, which used the left-shifted layout corresponding to ASCII, differently from traditional mechanical typewriters.

Electric typewriters, notably the IBM Selectric (1961), used a somewhat different layout that has become de facto standard on computers following the IBM PC (1981), especially Model M (1984) and thus shift values for symbols on modern keyboards do not correspond as closely to the ASCII table as earlier keyboards did. The /? pair also dates to the No. 2, and the ,< .> pairs were used on some keyboards (others, including the No. 2, did not shift , (comma) or . (full stop) so they could be used in uppercase without unshifting). However, ASCII split the ;: pair (dating to No. 2), and rearranged mathematical symbols (varied conventions, commonly -* =+) to :* ;+ -=.

Some then-common typewriter characters were not included, notably ½ ¼ ¢, while ^ ` ~  were included as diacritics for international use, and < > for mathematical use, together with the simple line characters \ | (in addition to common /). The @ symbol was not used in continental Europe and the committee expected it would be replaced by an accented À in the French variation, so the @ was placed in position 40hex, right before the letter A.

The control codes felt essential for data transmission were the start of message (SOM), end of address (EOA), end of message (EOM), end of transmission (EOT), "who are you?" (WRU), "are you?" (RU), a reserved device control (DC0), synchronous idle (SYNC), and acknowledge (ACK). These were positioned to maximize the Hamming distance between their bit patterns.

Character order
ASCII-code order is also called ASCIIbetical order. Collation of data is sometimes done in this order rather than "standard" alphabetical order (collating sequence). The main deviations in ASCII order are:
 All uppercase come before lowercase letters; for example, "Z" precedes "a"
 Digits and many punctuation marks come before letters

An intermediate order converts uppercase letters to lowercase before comparing ASCII values.

Character set

thumb
                                                                                                                                        

Character groups

Control characters
thumb|right|Early symbols assigned to the 32 control characters, space and delete characters. (ISO 2047, MIL-STD-188-100, 1972)

ASCII reserves the first 32 code points (numbers 0–31 decimal) and the last one (number 127 decimal) for control characters. These are codes intended  to control peripheral devices (such as printers), or to provide meta-information about data streams, such as those stored on magnetic tape. Despite their name, these code points do not represent printable characters (i.e. they are not characters at all, but signals). For debugging purposes, "placeholder" symbols (such as those given in ISO 2047 and its predecessors) are assigned to them.

For example, character 0x0A represents the "line feed" function (which causes a printer to advance its paper), and character 8 represents "backspace".  refers to control characters that do not include carriage return, line feed or white space as non-whitespace control characters. (NB. NO-WS-CTL.) Except for the control characters that prescribe elementary line-oriented formatting, ASCII does not define any mechanism for describing the structure or appearance of text within a document. Other schemes, such as markup languages, address page and document layout and formatting.

The original ASCII standard used only short descriptive phrases for each control character. The ambiguity this caused was sometimes intentional, for example where a character would be used slightly differently on a terminal link than on a data stream, and sometimes accidental, for example the standard is unclear about the meaning of "delete".

Probably the most influential single device affecting the interpretation of these characters was the Teletype Model 33 ASR, which was a printing terminal with an available paper tape reader/punch option. Paper tape was a very popular medium for long-term program storage until the 1980s, less costly and in some ways less fragile than magnetic tape. In particular, the Teletype Model 33 machine assignments for codes 17 (control-Q, DC1, also known as XON), 19 (control-S, DC3, also known as XOFF), and 127 (delete) became de facto standards. The Model 33 was also notable for taking the description of control-G (code 7, BEL, meaning audibly alert the operator) literally, as the unit contained an actual bell which it rang when it received a BEL character.  Because the keytop for the O key also showed a left-arrow symbol (from ASCII-1963, which had this character instead of underscore), a noncompliant use of code 15 (control-O, shift in) interpreted as "delete previous character" was also adopted by many early timesharing systems but eventually became neglected.

When a Teletype 33 ASR equipped with the automatic paper tape reader received a control-S (XOFF, an abbreviation for transmit off), it caused the tape reader to stop; receiving control-Q (XON, transmit on) caused the tape reader to resume.  This so-called flow control technique became adopted by several early computer operating systems as a "handshaking" signal warning a sender to stop transmission because of impending buffer overflow; it persists to this day in many systems as a manual output control technique. On some systems, control-S retains its meaning, but control-Q is replaced by a second control-S to resume output.

The 33 ASR also could be configured to employ control-R (DC2) and control-T (DC4) to start and stop the tape punch; on some units equipped with this function, the corresponding control character lettering on the keycap above the letter was TAPE and TAPE respectively.

Delete vs backspace
The Teletype could not move its typehead backwards, so it did not have a key on its keyboard to send a BS (backspace). Instead, there was a key marked  that sent code 127 (DEL). The purpose of this key was to erase mistakes in a manually-input paper tape: the operator had to push a button on the tape punch to back it up, then type the rubout, which punched all holes and replaced the mistake with a character that was intended to be ignored. Teletypes were commonly used with the less-expensive computers from Digital Equipment Corporation (DEC); these systems had to use what keys were available, and thus the DEL character was assigned to erase the previous character. Because of this, DEC video terminals (by default) sent the DEL character for the key marked "Backspace" while the separate key marked "Delete" sent an escape sequence; many other competing terminals sent a BS character for the backspace key.

The early Unix tty drivers, unlike some modern implementations, allowed only one character to be set to erase the previous character in canonical input processing (where a very simple line editor is available); this could be set to BS or DEL, but not both, resulting in recurring situations of ambiguity where users had to decide depending on what terminal they were using (shells that allow line editing, such as ksh, bash, and zsh, understand both). The assumption that no key sent a BS character allowed Ctrl+H to be used for other purposes, such as the "help" prefix command in GNU Emacs.

Escape
Many more of the control characters have been assigned meanings quite different from their original ones. The "escape" character (ESC, code 27), for example, was intended originally to allow sending of other control characters as literals instead of invoking their meaning, an "escape sequence". This is the same meaning of "escape" encountered in URL encodings, C language strings, and other systems where certain characters have a reserved meaning. Over time this interpretation has been co-opted and has eventually been changed.

In modern usage, an ESC sent to the terminal usually indicates the start of a command sequence, which can be used to address the cursor, scroll a region, set/query various terminal properties, and more. They are usually in the form of a so-called "ANSI escape code" (often starting with a "Control Sequence Introducer", "CSI", "") from ECMA-48 (1972) and its successors.  Some escape sequences do not have introducers, like the "Reset to Initial State", "RIS" command "".

In contrast, an ESC read from the terminal is most often used as an out-of-band character used to terminate an operation or special mode, as in the TECO and vi text editors. In graphical user interface (GUI) and windowing systems, ESC generally causes an application to abort its current operation or to exit (terminate) altogether.

End of line
The inherent ambiguity of many control characters, combined with their historical usage, created problems when transferring "plain text" files between systems. The best example of this is the newline problem on various operating systems. Teletype machines required that a line of text be terminated with both "carriage return" (which moves the printhead to the beginning of the line) and "line feed" (which advances the paper one line without moving the printhead). The name "carriage return" comes from the fact that on a manual typewriter the carriage holding the paper moves while the typebars that strike the ribbon remain stationary.  The entire carriage had to be pushed (returned) to the right in order to position the paper for the next line.

DEC operating systems (OS/8, RT-11, RSX-11, RSTS, TOPS-10, etc.) used both characters to mark the end of a line so that the console device (originally Teletype machines) would work. By the time so-called "glass TTYs" (later called CRTs or "dumb terminals") came along, the convention was so well established that backward compatibility necessitated continuing to follow it. When Gary Kildall created CP/M, he was inspired by some of the command line interface conventions used in DEC's RT-11 operating system.

Until the introduction of PC DOS in 1981, IBM had no influence in this because their 1970s operating systems used EBCDIC encoding instead of ASCII, and they were oriented toward punch-card input and line printer output on which the concept of "carriage return" was meaningless. IBM's PC DOS (also marketed as MS-DOS by Microsoft) inherited the convention by virtue of being loosely based on CP/M, and Windows in turn inherited it from MS-DOS.

Requiring two characters to mark the end of a line introduces unnecessary complexity and ambiguity as to how to interpret each character when encountered by itself. To simplify matters, plain text data streams, including files, on Multics used line feed (LF) alone as a line terminator. The tty driver would handle the LF to CRLF conversion on output so files can be directly printed to terminal, and NL (newline) is often used to refer to CRLF in UNIX documents. Unix and Unix-like systems, and Amiga systems, adopted this convention from Multics.  On the other hand, the original Macintosh OS, Apple DOS, and ProDOS used carriage return (CR) alone as a line terminator; however, since Apple later replaced these obsolete operating systems with their Unix-based macOS (formerly named OS X) operating system, they now use line feed (LF) as well. The Radio Shack TRS-80 also used a lone CR to terminate lines.

Computers attached to the ARPANET included machines running operating systems such as TOPS-10 and TENEX using CR-LF line endings; machines running operating systems such as Multics using LF line endings; and machines running operating systems such as OS/360 that represented lines as a character count followed by the characters of the line and which used EBCDIC rather than ASCII encoding.  The Telnet protocol defined an ASCII "Network Virtual Terminal" (NVT), so that connections between hosts with different line-ending conventions and character sets could be supported by transmitting a standard text format over the network. Telnet used ASCII along with CR-LF line endings, and software using other conventions would translate between the local conventions and the NVT. The File Transfer Protocol adopted the Telnet protocol, including use of the Network Virtual Terminal, for use when transmitting commands and transferring data in the default ASCII mode. This adds complexity to implementations of those protocols, and to other network protocols, such as those used for E-mail and the World Wide Web, on systems not using the NVT's CR-LF line-ending convention.

End of file/stream
The PDP-6 monitor, and its PDP-10 successor TOPS-10, used control-Z (SUB) as an end-of-file indication for input from a terminal.  Some operating systems such as CP/M tracked file length only in units of disk blocks, and used control-Z to mark the end of the actual text in the file. For these reasons, EOF, or end-of-file, was used colloquially and conventionally as a three-letter acronym for control-Z instead of SUBstitute.  The end-of-text character (ETX), also known as control-C, was inappropriate for a variety of reasons, while using control-Z as the control character to end a file is analogous to the letter Z's position at the end of the alphabet, and serves as a very convenient mnemonic aid. A historically common and still prevalent convention uses the ETX character convention to interrupt and halt a program via an input data stream, usually from a keyboard.

The Unix terminal driver uses the end-of-transmission character (EOT), also known as control-D, to indicate the end of a data stream.

In the C programming language, and in Unix conventions, the null character is used to terminate text strings; such null-terminated strings can be known in abbreviation as ASCIZ or ASCIIZ, where here Z stands for "zero".

Table of codes
Control code table
 Binary  Oct  Dec  Hex  Abbreviation  Unicode Control Pictures  Caret notation  C escape sequence  Name (1967) 1963  1965  1967 000 0000  000  0  00NULLNUL ␀       Null 000 0001  001  1  01SOMSOH ␁     Start of Heading 000 0010  002  2  02EOASTX ␂     Start of Text 000 0011  003  3  03EOMETX ␃     End of Text 000 0100  004  4  04EOT ␄     End of Transmission 000 0101  005  5  05WRUENQ ␅     Enquiry 000 0110  006  6  06RUACK ␆     Acknowledgement 000 0111  007  7  07BELLBEL ␇      Bell 000 1000  010  8  08FE0BS ␈      Backspace 000 1001  011  9  09HT/SKHT ␉      Horizontal Tab 000 1010  012  10  0ALF ␊      Line Feed 000 1011  013  11  0BVTABVT ␋      Vertical Tab 000 1100  014  12  0CFF ␌      Form Feed 000 1101  015  13  0DCR ␍      Carriage Return 000 1110  016  14  0ESO ␎     Shift Out 000 1111  017  15  0FSI ␏     Shift In 001 0000  020  16  10DC0DLE ␐     Data Link Escape 001 0001  021  17  11DC1 ␑     Device Control 1 (often XON) 001 0010  022  18  12DC2 ␒     Device Control 2 001 0011  023  19  13DC3 ␓     Device Control 3 (often XOFF) 001 0100  024  20  14DC4 ␔     Device Control 4 001 0101  025  21  15ERRNAK ␕     Negative Acknowledgement 001 0110  026  22  16SYNCSYN ␖     Synchronous Idle 001 0111  027  23  17LEMETB ␗     End of Transmission Block 001 1000  030  24  18S0CAN ␘     Cancel 001 1001  031  25  19S1EM ␙     End of Medium 001 1010  032  26  1AS2SSSUB ␚     Substitute 001 1011  033  27  1BS3ESC ␛      Escape 001 1100  034  28  1CS4FS ␜     File Separator 001 1101  035  29  1DS5GS ␝     Group Separator 001 1110  036  30  1ES6RS ␞     Record Separator 001 1111  037  31  1FS7US ␟     Unit Separator 111 1111  177  127  7FDEL ␡     Delete

Other representations might be used by specialist equipment, for example ISO 2047 graphics or hexadecimal numbers.

Printable character table

At the time of adoption, the codes 20hex to 7Ehex would cause the printing of a visible character (a glyph), and thus were designated "printable characters". These codes represent letters, digits, punctuation marks, and a few miscellaneous symbols. There are 95 printable characters in total.

The empty space between words, as produced by the space bar of a keyboard, is character code 20hex.  Since the space character is visible in printed text it considered a "printable character", even though it is unique in having no visible glyph. It is listed in the printable character table, as per the ASCII standard, instead of in the control character table.

Code 7Fhex corresponds to the non-printable "delete" (DEL) control character and is listed in the control character table.

Earlier versions of ASCII used the up arrow instead of the caret (5Ehex) and the left arrow instead of the underscore (5Fhex).

 Binary  Oct  Dec  Hex Glyph 1963  1965  1967010 0000  040  32  20  space (no visible glyph)010 0001  041  33  21 !010 0010  042  34  22 "010 0011  043  35  23 #010 0100  044  36  24 $010 0101  045  37  25 %010 0110  046  38  26 &010 0111  047  39  27 '010 1000  050  40  28 (010 1001  051  41  29 )010 1010  052  42  2A *010 1011  053  43  2B +010 1100  054  44  2C ,010 1101  055  45  2D -010 1110  056  46  2E .010 1111  057  47  2F /011 0000  060  48  30 0011 0001  061  49  31 1011 0010  062  50  32 2011 0011  063  51  33 3011 0100  064  52  34 4011 0101  065  53  35 5011 0110  066  54  36 6011 0111  067  55  37 7011 1000  070  56  38 8011 1001  071  57  39 9011 1010  072  58  3A :011 1011  073  59  3B ;011 1100  074  60  3C <011 1101  075  61  3D =011 1110  076  62  3E >011 1111  077  63  3F ?100 0000  100  64  40  @  `  @100 0001  101  65  41 A100 0010  102  66  42 B100 0011  103  67  43 C100 0100  104  68  44 D100 0101  105  69  45 E100 0110  106  70  46 F100 0111  107  71  47 G100 1000  110  72  48 H100 1001  111  73  49 I100 1010  112  74  4A J100 1011  113  75  4B K100 1100  114  76  4C L100 1101  115  77  4D M100 1110  116  78  4E N100 1111  117  79  4F O101 0000  120  80  50 P101 0001  121  81  51 Q101 0010  122  82  52 R101 0011  123  83  53 S101 0100  124  84  54 T101 0101  125  85  55 U101 0110  126  86  56 V101 0111  127  87  57 W101 1000  130  88  58 X101 1001  131  89  59 Y101 1010  132  90  5A Z101 1011  133  91  5B [101 1100  134  92  5C  \  ~  \101 1101  135  93  5D ]101 1110  136  94  5E  ↑ ^101 1111  137  95  5F  ← _110 0000  140  96  60   @  `110 0001  141  97  61  a110 0010  142  98  62  b110 0011  143  99  63  c110 0100  144  100  64  d110 0101  145  101  65  e110 0110  146  102  66  f110 0111  147  103  67  g110 1000  150  104  68  h110 1001  151  105  69  i110 1010  152  106  6A  j110 1011  153  107  6B  k110 1100  154  108  6C  l110 1101  155  109  6D  m110 1110  156  110  6E  n110 1111  157  111  6F  o111 0000  160  112  70  p111 0001  161  113  71  q111 0010  162  114  72  r111 0011  163  115  73  s111 0100  164  116  74  t111 0101  165  117  75  u111 0110  166  118  76  v111 0111  167  119  77  w111 1000  170  120  78  x111 1001  171  121  79  y111 1010  172  122  7A  z111 1011  173  123  7B  {111 1100  174  124  7C  ACK  ¬  |111 1101  175  125  7D  }111 1110  176  126  7E  ESC  |  ~

Usage
ASCII was first used commercially during 1963 as a seven-bit teleprinter code for American Telephone & Telegraph's TWX (TeletypeWriter eXchange) network. TWX originally used the earlier five-bit ITA2, which was also used by the competing Telex teleprinter system. Bob Bemer introduced features such as the escape sequence. His British colleague Hugh McGregor Ross helped to popularize this work according to Bemer, "so much so that the code that was to become ASCII was first called the Bemer–Ross Code in Europe". (NB. Bemer was employed at IBM at that time.) Because of his extensive work on ASCII, Bemer has been called "the father of ASCII".

On March 11, 1968, US President Lyndon B. Johnson mandated that all computers purchased by the United States Federal Government support ASCII, stating:
I have also approved recommendations of the Secretary of Commerce [Luther H. Hodges] regarding standards for recording the Standard Code for Information Interchange on magnetic tapes and paper tapes when they are used in computer operations.
All computers and related equipment configurations brought into the Federal Government inventory on and after July 1, 1969, must have the capability to use the Standard Code for Information Interchange and the formats prescribed by the magnetic tape and paper tape standards when these media are used.

ASCII was the most common character encoding on the World Wide Web until December 2007, when UTF-8 encoding surpassed it; UTF-8 is backward compatible with ASCII.

Variants and derivations
As computer technology spread throughout the world, different standards bodies and corporations developed many variations of ASCII to facilitate the expression of non-English languages that used Roman-based alphabets. One could class some of these variations as "ASCII extensions", although some misuse that term to represent all variants, including those that do not preserve ASCII's character-map in the 7-bit range. Furthermore, the ASCII extensions have also been mislabelled as ASCII.

7-bit codes

From early in its development,"Specific Criteria", attachment to memo from R. W. Reach, "X3-2 Meeting – September 14 and 15", September 18, 1961 ASCII was intended to be just one of several national variants of an international character code standard.

Other international standards bodies have ratified character encodings such as ISO 646 (1967) that are identical or nearly identical to ASCII, with extensions for characters outside the English alphabet and symbols used outside the United States, such as the symbol for the United Kingdom's pound sterling (£); e.g. with code page 1104. Almost every country needed an adapted version of ASCII, since ASCII suited the needs of only the US and a few other countries. For example, Canada had its own version that supported French characters.

Many other countries developed variants of ASCII to include non-English letters (e.g. é, ñ, ß, Ł), currency symbols (e.g. £, ¥), etc. See also YUSCII (Yugoslavia).

It would share most characters in common, but assign other locally useful characters to several code points reserved for "national use". However, the four years that elapsed between the publication of ASCII-1963 and ISO's first acceptance of an international recommendation during 1967 caused ASCII's choices for the national use characters to seem to be de facto standards for the world, causing confusion and incompatibility once other countries did begin to make their own assignments to these code points.

ISO/IEC 646, like ASCII, is a 7-bit character set. It does not make any additional codes available, so the same code points encoded different characters in different countries. Escape codes were defined to indicate which national variant applied to a piece of text, but they were rarely used, so it was often impossible to know what variant to work with and, therefore, which character a code represented, and in general, text-processing systems could cope with only one variant anyway.

Because the bracket and brace characters of ASCII were assigned to "national use" code points that were used for accented letters in other national variants of ISO/IEC 646, a German, French, or Swedish, etc. programmer using their national variant of ISO/IEC 646, rather than ASCII, had to write, and thus read, something such as

ä aÄiÜ = 'Ön'; ü

instead of

{ a[i] = '\n'; }

C trigraphs were created to solve this problem for ANSI C, although their late introduction and inconsistent implementation in compilers limited their use. Many programmers kept their computers on ASCII, so plain-text in Swedish, German etc. (for example, in e-mail or Usenet) contained "{, }" and similar variants in the middle of words, something those programmers got used to. For example, a Swedish programmer mailing another programmer asking if they should go for lunch, could get "N{ jag har sm|rg}sar" as the answer, which should be "Nä jag har smörgåsar" meaning "No I've got sandwiches".

In Japan and Korea, still  a variation of ASCII is used, in which the backslash (5C hex) is rendered as ¥ (a Yen sign, in Japan) or ₩ (a Won sign, in Korea). This means that, for example, the file path C:\Users\Smith is shown as C:¥Users¥Smith (in Japan) or C:₩Users₩Smith (in Korea).

In Europe, teletext character sets, which are variants of ASCII, are used for broadcast TV subtitles, defined by World System Teletext and broadcast using the DVB-TXT standard for embedding teletext into DVB transmissions. In the case that the subtitles were initially authored for teletext and converted, the derived subtitle formats are constrained to the same character sets.

8-bit codes

Eventually, as 8-, 16-, and 32-bit (and later 64-bit) computers began to replace 12-, 18-, and 36-bit computers as the norm, it became common to use an 8-bit byte to store each character in memory, providing an opportunity for extended, 8-bit relatives of ASCII. In most cases these developed as true extensions of ASCII, leaving the original character-mapping intact, but adding additional character definitions after the first 128 (i.e., 7-bit) characters. ASCII itself remained a seven-bit code: the term "extended ASCII" has no official status.

For some countries, 8-bit extensions of ASCII were developed that included support for characters used in local languages; for example, ISCII for India and VISCII for Vietnam. Kaypro CP/M computers used the "upper" 128 characters for the Greek alphabet.

Even for markets where it was not necessary to add many characters to support additional languages, manufacturers of early home computer systems often developed their own 8-bit extensions of ASCII to include additional characters, such as box-drawing characters, semigraphics, and video game sprites. Often, these additions also replaced control characters (index 0 to 31, as well as index 127) with even more platform-specific extensions. In other cases, the extra bit was used for some other purpose, such as toggling inverse video; this approach was used by ATASCII, an extension of ASCII developed by Atari.

Most ASCII extensions are based on ASCII-1967 (the current standard), but some extensions are instead based on the earlier ASCII-1963. For example, PETSCII, which was developed by Commodore International for their 8-bit systems, is based on ASCII-1963. Likewise, many Sharp MZ character sets are based on ASCII-1963.

IBM defined code page 437 for the IBM PC, replacing the control characters with graphic symbols such as smiley faces, and mapping additional graphic characters to the upper 128 positions. Digital Equipment Corporation developed the Multinational Character Set (DEC-MCS) for use in the popular VT220 terminal as one of the first extensions designed more for international languages than for block graphics. Apple defined Mac OS Roman for the Macintosh and Adobe defined the PostScript Standard Encoding for PostScript; both sets contained "international" letters, typographic symbols and punctuation marks instead of graphics, more like modern character sets.

The ISO/IEC 8859 standard (derived from the DEC-MCS) provided a standard that most systems copied (or at least were based on, when not copied exactly). A popular further extension designed by Microsoft, Windows-1252 (often mislabeled as ISO-8859-1), added the typographic punctuation marks needed for traditional text printing. ISO-8859-1, Windows-1252, and the original 7-bit ASCII were the most common character encoding methods on the World Wide Web until 2008, when UTF-8 overtook them.

ISO/IEC 4873 introduced 32 additional control codes defined in the 80–9F hexadecimal range, as part of extending the 7-bit ASCII encoding to become an 8-bit system.

Unicode

Unicode and the ISO/IEC 10646 Universal Character Set (UCS) have a much wider array of characters and their various encoding forms have begun to supplant ISO/IEC 8859 and ASCII rapidly in many environments. While ASCII is limited to 128 characters, Unicode and the UCS support more characters by separating the concepts of unique identification (using natural numbers called code points) and encoding (to 8-, 16-, or 32-bit binary formats, called UTF-8, UTF-16, and UTF-32, respectively).

ASCII was incorporated into the Unicode (1991) character set as the first 128 symbols, so the 7-bit ASCII characters have the same numeric codes in both sets. This allows UTF-8 to be backward compatible with 7-bit ASCII, as a UTF-8 file containing only ASCII characters is identical to an ASCII file containing the same sequence of characters.  Even more importantly, forward compatibility is ensured as software that recognizes only 7-bit ASCII characters as special and does not alter bytes with the highest bit set (as is often done to support 8-bit ASCII extensions such as ISO-8859-1) will preserve UTF-8 data unchanged.

See also

 3568 ASCII – an asteroid named after the character encoding
 
 
 
 
 Basic Latin (Unicode block) – ASCII as a subset of Unicode
 
 HTML decimal character rendering
 Jargon File – a glossary of computer programmer slang which includes a list of common slang names for ASCII characters
 List of computer character sets
 List of Unicode characters

Notes

References

Further reading
 
  from:
 
 
   (facsimile, not machine readable)
 
 

External links

 

 
Category:Computer-related introductions in 1963
Category:Character sets
Category:Character encoding
Category:Latin-script representations
Category:Presentation layer protocols
Category:American National Standards Institute standards